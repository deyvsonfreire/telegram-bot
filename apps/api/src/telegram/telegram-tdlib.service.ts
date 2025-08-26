import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TDLib from 'tdl';
import * as fs from 'fs-extra';
import * as path from 'path';

interface TDLibSession {
  id: string;
  phoneNumber: string;
  apiId: string;
  apiHash: string;
  encryptedSession?: string;
}

@Injectable()
export class TelegramTdlibService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramTdlibService.name);
  private clients: Map<string, any> = new Map();
  private sessions: Map<string, TDLibSession> = new Map();
  private readonly dbPath = './tdlib-db';
  private readonly filesPath = './tdlib-files';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.ensureDirectories();
    this.logger.log('TDLib Service inicializado');
  }

  async onModuleDestroy() {
    // Fechar todas as conexões TDLib
    for (const [sessionId, client] of this.clients) {
      try {
        await client.close();
        this.logger.log(`Cliente TDLib fechado para sessão: ${sessionId}`);
      } catch (error) {
        this.logger.error(`Erro ao fechar cliente TDLib: ${error.message}`);
      }
    }
  }

  private async ensureDirectories() {
    await fs.ensureDir(this.dbPath);
    await fs.ensureDir(this.filesPath);
  }

  async createSession(sessionData: TDLibSession): Promise<void> {
    try {
      const client = new TDLib.TDL({}, {});
      
      // Configurar parâmetros do TDLib
      await client.execute({
        '@type': 'setTdlibParameters',
        parameters: {
          '@type': 'tdlibParameters',
          use_test_dc: false,
          database_directory: path.join(this.dbPath, sessionData.id),
          files_directory: path.join(this.filesPath, sessionData.id),
          use_file_database: true,
          use_chat_info_database: true,
          use_message_database: true,
          use_secret_chats: false,
          api_id: sessionData.apiId,
          api_hash: sessionData.apiHash,
          system_language_code: 'pt',
          device_model: 'Desktop',
          system_version: 'Unknown',
          application_version: '1.0',
          enable_storage_optimizer: true,
          ignore_file_names: false,
        },
      });

      // Configurar handlers de eventos
      client.on('update', (update: any) => this.handleUpdate(sessionData.id, update));
      client.on('error', (error: any) => this.handleError(sessionData.id, error));

      this.clients.set(sessionData.id, client);
      this.sessions.set(sessionData.id, sessionData);
      
      this.logger.log(`Sessão TDLib criada: ${sessionData.id}`);
      
    } catch (error) {
      this.logger.error(`Erro ao criar sessão TDLib: ${error.message}`);
      throw error;
    }
  }

  private handleUpdate(sessionId: string, update: any) {
    if (update['@type'] === 'updateAuthorizationState') {
      this.handleAuthorizationState(sessionId, update.authorization_state);
    }
  }

  private handleAuthorizationState(sessionId: string, state: any) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    switch (state['@type']) {
      case 'authorizationStateWaitPhoneNumber':
        this.logger.log(`Sessão ${sessionId}: Aguardando número de telefone`);
        break;
      case 'authorizationStateWaitCode':
        this.logger.log(`Sessão ${sessionId}: Aguardando código de verificação`);
        break;
      case 'authorizationStateWaitPassword':
        this.logger.log(`Sessão ${sessionId}: Aguardando senha 2FA`);
        break;
      case 'authorizationStateReady':
        this.logger.log(`Sessão ${sessionId}: Autorização concluída`);
        break;
    }
  }

  private handleError(sessionId: string, error: any) {
    this.logger.error(`Erro TDLib na sessão ${sessionId}:`, error);
  }

  async setPhoneNumber(sessionId: string, phoneNumber: string): Promise<void> {
    const client = this.clients.get(sessionId);
    if (!client) throw new Error('Sessão não encontrada');

    await client.execute({
      '@type': 'setAuthenticationPhoneNumber',
      phone_number: phoneNumber,
    });
  }

  async setCode(sessionId: string, code: string): Promise<void> {
    const client = this.clients.get(sessionId);
    if (!client) throw new Error('Sessão não encontrada');

    await client.execute({
      '@type': 'checkAuthenticationCode',
      code: code,
    });
  }

  async setPassword(sessionId: string, password: string): Promise<void> {
    const client = this.clients.get(sessionId);
    if (!client) throw new Error('Sessão não encontrada');

    await client.execute({
      '@type': 'checkAuthenticationPassword',
      password: password,
    });
  }

  async getChats(sessionId: string, limit = 100): Promise<any[]> {
    const client = this.clients.get(sessionId);
    if (!client) throw new Error('Sessão não encontrada');

    try {
      const chats = await client.execute({
        '@type': 'getChats',
        limit: limit,
      });

      const enrichedChats = [];
      
      for (const chatId of chats.chat_ids) {
        const chat = await client.execute({
          '@type': 'getChat',
          chat_id: chatId,
        });
        
        enrichedChats.push({
          id: chat.id,
          type: chat.type['@type'],
          title: chat.title,
          username: chat.username,
          memberCount: chat.member_count,
        });
      }

      return enrichedChats;
      
    } catch (error) {
      this.logger.error(`Erro ao obter chats da sessão ${sessionId}:`, error);
      throw error;
    }
  }

  async getChatMembers(sessionId: string, chatId: number, limit = 200): Promise<any[]> {
    const client = this.clients.get(sessionId);
    if (!client) throw new Error('Sessão não encontrada');

    try {
      const members = await client.execute({
        '@type': 'getChatMembers',
        chat_id: chatId,
        limit: limit,
        offset: 0,
      });

      const enrichedMembers = [];
      
      for (const member of members.members) {
        if (member.member_id['@type'] === 'messageSenderUser') {
          const userId = member.member_id.user_id;
          
          // Obter informações detalhadas do usuário
          const user = await client.execute({
            '@type': 'getUser',
            user_id: userId,
          });

          // Verificar se é contato
          const isContact = user.is_contact;
          
          enrichedMembers.push({
            userId: user.id,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            phoneNumber: user.phone_number, // Só disponível se for contato
            isContact,
            isBot: user.type['@type'] === 'userTypeBot',
          });
        }
      }

      return enrichedMembers;
      
    } catch (error) {
      this.logger.error(`Erro ao obter membros do chat ${chatId} da sessão ${sessionId}:`, error);
      throw error;
    }
  }

  async getContacts(sessionId: string): Promise<any[]> {
    const client = this.clients.get(sessionId);
    if (!client) throw new Error('Sessão não encontrada');

    try {
      const contacts = await client.execute({
        '@type': 'getContacts',
      });

      const enrichedContacts = [];
      
      for (const userId of contacts.user_ids) {
        const user = await client.execute({
          '@type': 'getUser',
          user_id: userId,
        });

        enrichedContacts.push({
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          phoneNumber: user.phone_number,
          isContact: user.is_contact,
        });
      }

      return enrichedContacts;
      
    } catch (error) {
      this.logger.error(`Erro ao obter contatos da sessão ${sessionId}:`, error);
      throw error;
    }
  }

  async isSessionReady(sessionId: string): Promise<boolean> {
    return this.clients.has(sessionId);
  }

  async closeSession(sessionId: string): Promise<void> {
    const client = this.clients.get(sessionId);
    if (client) {
      await client.close();
      this.clients.delete(sessionId);
      this.sessions.delete(sessionId);
      this.logger.log(`Sessão TDLib fechada: ${sessionId}`);
    }
  }
}
