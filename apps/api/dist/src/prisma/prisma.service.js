"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    async onModuleInit() {
        try {
            if (process.env.NODE_ENV !== 'test') {
                await this.$connect();
                console.log('✅ Conectado ao banco de dados PostgreSQL');
            }
        }
        catch (error) {
            console.warn('⚠️ Não foi possível conectar ao banco de dados:', error.message);
            console.warn('⚠️ A aplicação continuará funcionando, mas algumas funcionalidades podem não estar disponíveis');
        }
    }
    async onModuleDestroy() {
        try {
            await this.$disconnect();
            console.log('✅ Desconectado do banco de dados PostgreSQL');
        }
        catch (error) {
            console.warn('⚠️ Erro ao desconectar do banco de dados:', error.message);
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
//# sourceMappingURL=prisma.service.js.map