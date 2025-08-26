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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const telegram_service_1 = require("./telegram.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let TelegramController = class TelegramController {
    constructor(telegramService) {
        this.telegramService = telegramService;
    }
    async verifySession(sessionId, code) {
        return this.telegramService.verifySession(sessionId, code);
    }
    async createSession(data, req) {
        return this.telegramService.createSession(data, req.user.id);
    }
    async getSessions(req) {
        return this.telegramService.getSessions(req.user.id);
    }
    async getDialogs(sessionId) {
        return this.telegramService.getDialogs(sessionId);
    }
    async syncDialogs(sessionId, req) {
        return this.telegramService.syncDialogs(sessionId, req.user.id);
    }
    async syncContacts(sessionId, req) {
        return this.telegramService.syncContacts(sessionId, req.user.id);
    }
    async getMembers(dialogId, page = '1', limit = '50') {
        return this.telegramService.getMembers(dialogId, parseInt(page), parseInt(limit));
    }
    async startCollectMembers(dialogId, data, req) {
        return this.telegramService.startCollectMembers(dialogId, req.user.id);
    }
    async getJobs(req, page = '1', limit = '20') {
        return this.telegramService.getJobs(req.user.id, parseInt(page), parseInt(limit));
    }
};
exports.TelegramController = TelegramController;
__decorate([
    (0, common_1.Post)('sessions/:sessionId/verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar sessão do Telegram com código' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "verifySession", null);
__decorate([
    (0, common_1.Post)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar nova sessão do Telegram' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar sessões do usuário' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Get)('sessions/:sessionId/dialogs'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar diálogos de uma sessão' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "getDialogs", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/sync-dialogs'),
    (0, swagger_1.ApiOperation)({ summary: 'Sincronizar diálogos de uma sessão' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "syncDialogs", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/sync-contacts'),
    (0, swagger_1.ApiOperation)({ summary: 'Sincronizar contatos de uma sessão' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "syncContacts", null);
__decorate([
    (0, common_1.Get)('dialogs/:dialogId/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar membros de um diálogo' }),
    __param(0, (0, common_1.Param)('dialogId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Post)('dialogs/:dialogId/collect-members'),
    (0, swagger_1.ApiOperation)({ summary: 'Iniciar coleta de membros' }),
    __param(0, (0, common_1.Param)('dialogId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "startCollectMembers", null);
__decorate([
    (0, common_1.Get)('jobs'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar jobs do usuário' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "getJobs", null);
exports.TelegramController = TelegramController = __decorate([
    (0, swagger_1.ApiTags)('Telegram'),
    (0, common_1.Controller)('telegram'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [telegram_service_1.TelegramService])
], TelegramController);
//# sourceMappingURL=telegram.controller.js.map