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
var CollectMembersProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectMembersProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const telegram_tdlib_service_1 = require("../telegram-tdlib.service");
let CollectMembersProcessor = CollectMembersProcessor_1 = class CollectMembersProcessor {
    constructor(prisma, tdlibService) {
        this.prisma = prisma;
        this.tdlibService = tdlibService;
        this.logger = new common_1.Logger(CollectMembersProcessor_1.name);
    }
    async handleCollectMembers(job) {
        const { dialogId, sessionId, telegramDialogId, dialogTitle, userId } = job.data;
        this.logger.log(`Iniciando coleta de membros para ${dialogTitle} (${telegramDialogId})`);
        try {
            await this.prisma.job.updateMany({
                where: {
                    type: 'COLLECT_MEMBERS',
                    dialogId,
                    createdById: userId,
                },
                data: { status: 'RUNNING', startedAt: new Date() },
            });
            const members = await this.tdlibService.getChatMembers(sessionId, Number(telegramDialogId));
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
        }
        catch (error) {
            this.logger.error(`Erro na coleta de membros: ${error.message}`, error.stack);
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
};
exports.CollectMembersProcessor = CollectMembersProcessor;
__decorate([
    (0, bull_1.Process)('collect-members'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CollectMembersProcessor.prototype, "handleCollectMembers", null);
exports.CollectMembersProcessor = CollectMembersProcessor = CollectMembersProcessor_1 = __decorate([
    (0, bull_1.Processor)('telegram-jobs'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_tdlib_service_1.TelegramTdlibService])
], CollectMembersProcessor);
//# sourceMappingURL=collect-members.processor.js.map