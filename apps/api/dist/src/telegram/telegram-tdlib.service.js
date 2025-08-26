"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramTdlibService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramTdlibService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const TDLib = require("tdl");
const fs = require("fs-extra");
const path = require("path");
let TelegramTdlibService = TelegramTdlibService_1 = class TelegramTdlibService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(TelegramTdlibService_1.name);
        this.clients = new Map();
        this.sessions = new Map();
        this.dbPath = './tdlib-db';
        this.filesPath = './tdlib-files';
    }
    async onModuleInit() {
        await this.ensureDirectories();
        this.logger.log('TDLib Service inicializado');
    }
    async onModuleDestroy() {
        for (const [sessionId, client] of this.clients) {
            try {
                await client.close();
                this.logger.log(`Cliente TDLib fechado para sessão: ${sessionId}`);
            }
            catch (error) {
                this.logger.error(`Erro ao fechar cliente TDLib: ${error.message}`);
            }
        }
    }
    async ensureDirectories() {
        await fs.ensureDir(this.dbPath);
        await fs.ensureDir(this.filesPath);
    }
    async createSession(sessionData) {
        try {
            const client = new TDLib.TDL({}, {});
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
            client.on('update', (update) => this.handleUpdate(sessionData.id, update));
            client.on('error', (error) => this.handleError(sessionData.id, error));
            this.clients.set(sessionData.id, client);
            this.sessions.set(sessionData.id, sessionData);
            this.logger.log(`Sessão TDLib criada: ${sessionData.id}`);
        }
        catch (error) {
            this.logger.error(`Erro ao criar sessão TDLib: ${error.message}`);
            throw error;
        }
    }
    handleUpdate(sessionId, update) {
        if (update['@type'] === 'updateAuthorizationState') {
            this.handleAuthorizationState(sessionId, update.authorization_state);
        }
    }
    handleAuthorizationState(sessionId, state) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
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
    handleError(sessionId, error) {
        this.logger.error(`Erro TDLib na sessão ${sessionId}:`, error);
    }
    async setPhoneNumber(sessionId, phoneNumber) {
        const client = this.clients.get(sessionId);
        if (!client)
            throw new Error('Sessão não encontrada');
        await client.execute({
            '@type': 'setAuthenticationPhoneNumber',
            phone_number: phoneNumber,
        });
    }
    async setCode(sessionId, code) {
        const client = this.clients.get(sessionId);
        if (!client)
            throw new Error('Sessão não encontrada');
        await client.execute({
            '@type': 'checkAuthenticationCode',
            code: code,
        });
    }
    async setPassword(sessionId, password) {
        const client = this.clients.get(sessionId);
        if (!client)
            throw new Error('Sessão não encontrada');
        await client.execute({
            '@type': 'checkAuthenticationPassword',
            password: password,
        });
    }
    async getChats(sessionId, limit = 100) {
        const client = this.clients.get(sessionId);
        if (!client)
            throw new Error('Sessão não encontrada');
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
        }
        catch (error) {
            this.logger.error(`Erro ao obter chats da sessão ${sessionId}:`, error);
            throw error;
        }
    }
    async getChatMembers(sessionId, chatId, limit = 200) {
        const client = this.clients.get(sessionId);
        if (!client)
            throw new Error('Sessão não encontrada');
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
                    const user = await client.execute({
                        '@type': 'getUser',
                        user_id: userId,
                    });
                    const isContact = user.is_contact;
                    enrichedMembers.push({
                        userId: user.id,
                        username: user.username,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        phoneNumber: user.phone_number,
                        isContact,
                        isBot: user.type['@type'] === 'userTypeBot',
                    });
                }
            }
            return enrichedMembers;
        }
        catch (error) {
            this.logger.error(`Erro ao obter membros do chat ${chatId} da sessão ${sessionId}:`, error);
            throw error;
        }
    }
    async getContacts(sessionId) {
        const client = this.clients.get(sessionId);
        if (!client)
            throw new Error('Sessão não encontrada');
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
        }
        catch (error) {
            this.logger.error(`Erro ao obter contatos da sessão ${sessionId}:`, error);
            throw error;
        }
    }
    async isSessionReady(sessionId) {
        return this.clients.has(sessionId);
    }
    async closeSession(sessionId) {
        const client = this.clients.get(sessionId);
        if (client) {
            await client.close();
            this.clients.delete(sessionId);
            this.sessions.delete(sessionId);
            this.logger.log(`Sessão TDLib fechada: ${sessionId}`);
        }
    }
};
exports.TelegramTdlibService = TelegramTdlibService;
exports.TelegramTdlibService = TelegramTdlibService = TelegramTdlibService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TelegramTdlibService);
//# sourceMappingURL=telegram-tdlib.service.js.map