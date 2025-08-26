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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../prisma/prisma.service");
const telegram_tdlib_service_1 = require("./telegram-tdlib.service");
let TelegramService = TelegramService_1 = class TelegramService {
    constructor(prisma, tdlibService, telegramQueue) {
        this.prisma = prisma;
        this.tdlibService = tdlibService;
        this.telegramQueue = telegramQueue;
        this.logger = new common_1.Logger(TelegramService_1.name);
    }
    async createSession(data, userId) {
        try {
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
            if (data.type === 'user' && data.apiId && data.apiHash) {
                await this.tdlibService.createSession({
                    id: session.id,
                    phoneNumber: data.phoneNumber || '',
                    apiId: data.apiId,
                    apiHash: data.apiHash,
                });
            }
            return session;
        }
        catch (error) {
            this.logger.error(`Erro ao criar sessão: ${error.message}`);
            throw error;
        }
    }
    async getSessions(userId) {
        return this.prisma.telegramSession.findMany({
            where: { createdById: userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async verifySession(sessionId, code) {
        try {
            this.logger.log(`Verificando sessão ${sessionId} com código`);
            await this.tdlibService.setCode(sessionId, code);
            await this.prisma.telegramSession.update({
                where: { id: sessionId },
                data: { status: 'ACTIVE' },
            });
            return { success: true, message: 'Sessão verificada com sucesso' };
        }
        catch (error) {
            this.logger.error(`Erro ao verificar sessão ${sessionId}: ${error.message}`);
            await this.prisma.telegramSession.update({
                where: { id: sessionId },
                data: { status: 'ERROR' },
            });
            throw error;
        }
    }
    async getDialogs(sessionId) {
        return this.prisma.dialog.findMany({
            where: { sessionId },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async syncDialogs(sessionId, userId) {
        try {
            const isReady = await this.tdlibService.isSessionReady(sessionId);
            if (!isReady) {
                throw new Error('Sessão TDLib não está pronta');
            }
            const chats = await this.tdlibService.getChats(sessionId);
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
        }
        catch (error) {
            this.logger.error(`Erro na sincronização de diálogos: ${error.message}`);
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
    mapTelegramType(telegramType) {
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
    async getMembers(dialogId, page = 1, limit = 50) {
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
    async startCollectMembers(dialogId, userId) {
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
    async getJobs(userId, page = 1, limit = 20) {
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
    async syncContacts(sessionId, userId) {
        try {
            const isReady = await this.tdlibService.isSessionReady(sessionId);
            if (!isReady) {
                throw new Error('Sessão TDLib não está pronta');
            }
            const contacts = await this.tdlibService.getContacts(sessionId);
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
        }
        catch (error) {
            this.logger.error(`Erro na sincronização de contatos: ${error.message}`);
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
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bull_1.InjectQueue)('telegram-jobs')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_tdlib_service_1.TelegramTdlibService, Object])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map