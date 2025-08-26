import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramTdlibService } from '../telegram-tdlib.service';

@Processor('telegram-jobs')
export class CollectMembersProcessor {
  private readonly logger = new Logger(CollectMembersProcessor.name);

  constructor(
    private prisma: PrismaService,
    private tdlibService: TelegramTdlibService,
  ) {}

  @Process('collect-members')
  async handleCollectMembers(job: Job) {
    const { dialogId, sessionId, telegramDialogId, dialogTitle, userId } = job.data;
    
    this.logger.log(`Iniciando coleta de membros para ${dialogTitle} (${telegramDialogId})`);
    
    try {
      // Atualizar status do job
      await this.prisma.job.updateMany({
        where: { 
          type: 'COLLECT_MEMBERS',
          dialogId,
          createdById: userId,
        },
        data: { status: 'RUNNING', startedAt: new Date() },
      });

      // Coletar membros via TDLib
      const members = await this.tdlibService.getChatMembers(sessionId, Number(telegramDialogId));
      
      // Processar e salvar membros
      const savedMembers = [];
      for (const member of members) {
        const savedMember = await this.prisma.member.upsert({
          where: { telegramId: BigInt(member.userId) },
          update: {
            username: member.username,
            firstName: member.firstName,
            lastName: member.lastName,
            phoneNumber: member.phoneNumber,
            isContact: member.isContact,
            isBot: member.isBot,
            updatedAt: new Date(),
          },
          create: {
            telegramId: BigInt(member.userId),
            username: member.username,
            firstName: member.firstName,
            lastName: member.lastName,
            phoneNumber: member.phoneNumber,
            isContact: member.isContact,
            isBot: member.isBot,
            dialogId,
          },
        });
        
        savedMembers.push(savedMember);
      }

      // Atualizar job como concluído
      await this.prisma.job.updateMany({
        where: { 
          type: 'COLLECT_MEMBERS',
          dialogId,
          createdById: userId,
        },
        data: { 
          status: 'COMPLETED',
          result: { count: savedMembers.length },
          finishedAt: new Date(),
        },
      });

      this.logger.log(`Coleta concluída: ${savedMembers.length} membros salvos`);
      return { success: true, count: savedMembers.length };
      
    } catch (error) {
      this.logger.error(`Erro na coleta de membros: ${error.message}`, error.stack);
      
      // Atualizar job como falhou
      await this.prisma.job.updateMany({
        where: { 
          type: 'COLLECT_MEMBERS',
          dialogId,
          createdById: userId,
        },
        data: { 
          status: 'FAILED',
          error: error.message,
          finishedAt: new Date(),
        },
      });
      
      throw error;
    }
  }
}
