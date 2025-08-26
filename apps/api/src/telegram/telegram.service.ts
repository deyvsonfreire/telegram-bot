import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramTdlibService } from './telegram-tdlib.service';
import { CreateSessionInput } from '@telegram-manager/shared';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private prisma: PrismaService,
    private tdlibService: TelegramTdlibService,
    @InjectQueue('telegram-jobs') private telegramQueue: Queue,
  ) {}

  async createSession(data: CreateSessionInput, userId: string) {
    try {
      // Criar sessão no banco
      const session = await this.prisma.telegramSession.create({
        data: {
          type: data.type === 'user' ? 'USER' : 'BOT',
          label: data.label,
          phoneNumber: data.phoneNumber,
          apiId: data.apiId,
          apiHash: data.apiHash,
          createdById: userId,
        },
      });

      // Se for sessão de usuário, inicializar TDLib
      if (data.type === 'user' && data.apiId && data.apiHash) {
        await this.tdlibService.createSession({
          id: session.id,
          phoneNumber: data.phoneNumber || '',
          apiId: data.apiId,
          apiHash: data.apiHash,
        });
      }

      return session;
    } catch (error) {
      this.logger.error(`Erro ao criar sessão: ${error.message}`);
      throw error;
    }
  }

  async getSessions(userId: string) {
    return this.prisma.telegramSession.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifySession(sessionId: string, code: string) {
    try {
      this.logger.log(`Verificando sessão ${sessionId} com código`);
      await this.tdlibService.setCode(sessionId, code);
      
      // Atualizar status da sessão no banco
      await this.prisma.telegramSession.update({
        where: { id: sessionId },
        data: { status: 'ACTIVE' },
      });

      return { success: true, message: 'Sessão verificada com sucesso' };
    } catch (error) {
      this.logger.error(`Erro ao verificar sessão ${sessionId}: ${error.message}`);
      await this.prisma.telegramSession.update({
        where: { id: sessionId },
        data: { status: 'ERROR' },
      });
      throw error;
    }
  }

  async getDialogs(sessionId: string) {
    return this.prisma.dialog.findMany({
      where: { sessionId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async syncDialogs(sessionId: string, userId: string) {
    try {
      // Verificar se a sessão está pronta
      const isReady = await this.tdlibService.isSessionReady(sessionId);
      if (!isReady) {
        throw new Error('Sessão TDLib não está pronta');
      }

      // Buscar chats via TDLib
      const chats = await this.tdlibService.getChats(sessionId);
      
      // Sincronizar com o banco
      const syncedDialogs = [];
      for (const chat of chats) {
        const dialog = await this.prisma.dialog.upsert({
          where: { telegramId: BigInt(chat.id) },
          update: {
            title: chat.title,
            username: chat.username,
            memberCount: chat.memberCount,
            lastSyncAt: new Date(),
            updatedAt: new Date(),
          },
          create: {
            telegramId: BigInt(chat.id),
            type: this.mapTelegramType(chat.type),
            title: chat.title,
            username: chat.username,
            memberCount: chat.memberCount,
            sessionId,
          },
        });
        
        syncedDialogs.push(dialog);
      }

      // Registrar job de sincronização
      await this.prisma.job.create({
        data: {
          type: 'SYNC_DIALOGS',
          status: 'COMPLETED',
          payload: { sessionId, count: syncedDialogs.length },
          result: { count: syncedDialogs.length },
          createdById: userId,
        },
      });

      this.logger.log(`Sincronização de diálogos concluída: ${syncedDialogs.length} diálogos`);
      return { success: true, count: syncedDialogs.length, dialogs: syncedDialogs };
      
    } catch (error) {
      this.logger.error(`Erro na sincronização de diálogos: ${error.message}`);
      
      // Registrar job falhou
      await this.prisma.job.create({
        data: {
          type: 'SYNC_DIALOGS',
          status: 'FAILED',
          payload: { sessionId },
          error: error.message,
          createdById: userId,
        },
      });
      
      throw error;
    }
  }

  private mapTelegramType(telegramType: string): 'PRIVATE' | 'GROUP' | 'CHANNEL' | 'SUPERGROUP' {
    switch (telegramType) {
      case 'chatTypePrivate':
        return 'PRIVATE';
      case 'chatTypeBasicGroup':
        return 'GROUP';
      case 'chatTypeSupergroup':
        return 'SUPERGROUP';
      case 'chatTypeChannel':
        return 'CHANNEL';
      default:
        return 'GROUP';
    }
  }

  async getMembers(dialogId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    const [members, total] = await Promise.all([
      this.prisma.member.findMany({
        where: { dialogId },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.member.count({
        where: { dialogId },
      }),
    ]);

    return {
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async startCollectMembers(dialogId: string, userId: string) {
    const dialog = await this.prisma.dialog.findUnique({
      where: { id: dialogId },
    });

    if (!dialog) {
      throw new Error('Diálogo não encontrado');
    }

    const job = await this.telegramQueue.add('collect-members', {
      dialogId,
      telegramDialogId: dialog.telegramId,
      dialogTitle: dialog.title,
      userId,
    }, {
      jobId: `collect-${dialogId}-${Date.now()}`,
      removeOnComplete: false,
      removeOnFail: false,
    });

    // Registrar job no banco
    await this.prisma.job.create({
      data: {
        type: 'COLLECT_MEMBERS',
        payload: { dialogId },
        dialogId,
        createdById: userId,
      },
    });

    return { jobId: job.id };
  }

  async getJobs(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where: { createdById: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          dialog: true,
          session: true,
        },
      }),
      this.prisma.job.count({
        where: { createdById: userId },
      }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async syncContacts(sessionId: string, userId: string) {
    try {
      // Verificar se a sessão está pronta
      const isReady = await this.tdlibService.isSessionReady(sessionId);
      if (!isReady) {
        throw new Error('Sessão TDLib não está pronta');
      }

      // Buscar contatos via TDLib
      const contacts = await this.tdlibService.getContacts(sessionId);
      
      // Sincronizar com o banco
      const syncedContacts = [];
      for (const contact of contacts) {
        const dbContact = await this.prisma.contact.upsert({
          where: { telegramId: BigInt(contact.id) },
          update: {
            username: contact.username,
            firstName: contact.firstName,
            lastName: contact.lastName,
            phoneNumber: contact.phoneNumber,
            updatedAt: new Date(),
          },
          create: {
            telegramId: BigInt(contact.id),
            username: contact.username,
            firstName: contact.firstName,
            lastName: contact.lastName,
            phoneNumber: contact.phoneNumber,
            sessionId,
          },
        });
        
        syncedContacts.push(dbContact);
      }

      // Registrar job de sincronização
      await this.prisma.job.create({
        data: {
          type: 'SYNC_CONTACTS',
          status: 'COMPLETED',
          payload: { sessionId, count: syncedContacts.length },
          result: { count: syncedContacts.length },
          createdById: userId,
        },
      });

      this.logger.log(`Sincronização de contatos concluída: ${syncedContacts.length} contatos`);
      return { success: true, count: syncedContacts.length, contacts: syncedContacts };
      
    } catch (error) {
      this.logger.error(`Erro na sincronização de contatos: ${error.message}`);
      
      // Registrar job falhou
      await this.prisma.job.create({
        data: {
          type: 'SYNC_CONTACTS',
          status: 'FAILED',
          payload: { sessionId },
          error: error.message,
          createdById: userId,
        },
      });
      
      throw error;
    }
  }
}
