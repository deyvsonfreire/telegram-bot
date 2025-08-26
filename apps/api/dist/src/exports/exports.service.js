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
var ExportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const csv_writer_1 = require("csv-writer");
const fs = require("fs-extra");
const path = require("path");
let ExportsService = ExportsService_1 = class ExportsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ExportsService_1.name);
        this.exportsDir = './exports';
        this.ensureExportsDirectory();
    }
    async ensureExportsDirectory() {
        await fs.ensureDir(this.exportsDir);
    }
    async createExport(name, description, filters, userId, format = 'csv') {
        try {
            const exportRecord = await this.prisma.export.create({
                data: {
                    name,
                    description,
                    filters: filters,
                    status: 'PROCESSING',
                    createdById: userId,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            this.processExport(exportRecord.id, filters, format);
            return {
                id: exportRecord.id,
                fileUrl: '',
                fileSize: 0,
                recordCount: 0,
            };
        }
        catch (error) {
            this.logger.error(`Erro ao criar exportação: ${error.message}`);
            throw error;
        }
    }
    async processExport(exportId, filters, format) {
        try {
            const data = await this.getDataForExport(filters);
            const result = await this.generateFile(exportId, data, format);
            await this.prisma.export.update({
                where: { id: exportId },
                data: {
                    status: 'COMPLETED',
                    fileUrl: result.fileUrl,
                    fileSize: result.fileSize,
                },
            });
            this.logger.log(`Exportação ${exportId} concluída com sucesso`);
        }
        catch (error) {
            this.logger.error(`Erro ao processar exportação ${exportId}: ${error.message}`);
            await this.prisma.export.update({
                where: { id: exportId },
                data: {
                    status: 'FAILED',
                },
            });
        }
    }
    async getDataForExport(filters) {
        const where = {};
        if (filters.dialogIds && filters.dialogIds.length > 0) {
            where.dialogId = { in: filters.dialogIds };
        }
        if (filters.onlyContacts) {
            where.isContact = true;
        }
        if (filters.dateRange) {
            where.createdAt = {
                gte: new Date(filters.dateRange.from),
                lte: new Date(filters.dateRange.to),
            };
        }
        if (filters.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { username: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const members = await this.prisma.member.findMany({
            where,
            include: {
                dialog: {
                    select: {
                        title: true,
                        type: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return members.map(member => {
            const exportData = {
                id: member.id,
                telegramId: member.telegramId.toString(),
                username: member.username || '',
                firstName: member.firstName || '',
                lastName: member.lastName || '',
                isContact: member.isContact,
                isBot: member.isBot,
                dialogTitle: member.dialog?.title || '',
                dialogType: member.dialog?.type || '',
                createdAt: member.createdAt.toISOString(),
                updatedAt: member.updatedAt.toISOString(),
            };
            if (filters.includePhones && member.phoneNumber) {
                exportData.phoneNumber = member.phoneNumber;
            }
            return exportData;
        });
    }
    async generateFile(exportId, data, format) {
        const filename = `export_${exportId}_${Date.now()}`;
        if (format === 'csv') {
            return this.generateCSV(filename, data);
        }
        else {
            return this.generateJSON(filename, data);
        }
    }
    async generateCSV(filename, data) {
        const filePath = path.join(this.exportsDir, `${filename}.csv`);
        if (data.length === 0) {
            const headers = Object.keys(data[0] || {}).map(key => ({ id: key, title: key }));
            const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
                path: filePath,
                header: headers,
            });
            await csvWriter.writeRecords([]);
        }
        else {
            const headers = Object.keys(data[0]).map(key => ({ id: key, title: key }));
            const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
                path: filePath,
                header: headers,
            });
            await csvWriter.writeRecords(data);
        }
        const stats = await fs.stat(filePath);
        const fileUrl = `/exports/${filename}.csv`;
        return {
            fileUrl,
            fileSize: stats.size,
        };
    }
    async generateJSON(filename, data) {
        const filePath = path.join(this.exportsDir, `${filename}.json`);
        const jsonContent = JSON.stringify(data, null, 2);
        await fs.writeFile(filePath, jsonContent, 'utf8');
        const stats = await fs.stat(filePath);
        const fileUrl = `/exports/${filename}.json`;
        return {
            fileUrl,
            fileSize: stats.size,
        };
    }
    async getExports(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [exports, total] = await Promise.all([
            this.prisma.export.findMany({
                where: { createdById: userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.export.count({
                where: { createdById: userId },
            }),
        ]);
        return {
            exports,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getExport(exportId, userId) {
        const exportRecord = await this.prisma.export.findFirst({
            where: {
                id: exportId,
                createdById: userId,
            },
        });
        if (!exportRecord) {
            throw new Error('Exportação não encontrada');
        }
        return exportRecord;
    }
    async deleteExport(exportId, userId) {
        const exportRecord = await this.prisma.export.findFirst({
            where: {
                id: exportId,
                createdById: userId,
            },
        });
        if (!exportRecord) {
            throw new Error('Exportação não encontrada');
        }
        if (exportRecord.fileUrl) {
            const filePath = path.join(this.exportsDir, path.basename(exportRecord.fileUrl));
            try {
                await fs.remove(filePath);
            }
            catch (error) {
                this.logger.warn(`Arquivo não encontrado para remoção: ${filePath}`);
            }
        }
        await this.prisma.export.delete({
            where: { id: exportId },
        });
        return { message: 'Exportação removida com sucesso' };
    }
    async cleanupExpiredExports() {
        const expiredExports = await this.prisma.export.findMany({
            where: {
                expiresAt: { lt: new Date() },
                status: 'COMPLETED',
            },
        });
        for (const exportRecord of expiredExports) {
            try {
                if (exportRecord.fileUrl) {
                    const filePath = path.join(this.exportsDir, path.basename(exportRecord.fileUrl));
                    await fs.remove(filePath);
                }
                await this.prisma.export.update({
                    where: { id: exportRecord.id },
                    data: { status: 'EXPIRED' },
                });
                this.logger.log(`Exportação expirada limpa: ${exportRecord.id}`);
            }
            catch (error) {
                this.logger.error(`Erro ao limpar exportação expirada ${exportRecord.id}: ${error.message}`);
            }
        }
    }
};
exports.ExportsService = ExportsService;
exports.ExportsService = ExportsService = ExportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExportsService);
//# sourceMappingURL=exports.service.js.map