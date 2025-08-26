import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

interface ExportFilters {
  dialogIds?: string[];
  includePhones?: boolean;
  onlyContacts?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  search?: string;
}

export interface ExportResult {
  id: string;
  fileUrl: string;
  fileSize: number;
  recordCount: number;
}

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);
  private readonly exportsDir = './exports';

  constructor(private prisma: PrismaService) {
    this.ensureExportsDirectory();
  }

  private async ensureExportsDirectory() {
    await fs.ensureDir(this.exportsDir);
  }

  async createExport(
    name: string,
    description: string,
    filters: ExportFilters,
    userId: string,
    format: 'csv' | 'json' = 'csv'
  ): Promise<ExportResult> {
    try {
      // Criar registro de exportação
      const exportRecord = await this.prisma.export.create({
        data: {
          name,
          description,
          filters: filters as any,
          status: 'PROCESSING',
          createdById: userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        },
      });

      // Processar exportação em background
      this.processExport(exportRecord.id, filters, format);

      return {
        id: exportRecord.id,
        fileUrl: '',
        fileSize: 0,
        recordCount: 0,
      };
    } catch (error) {
      this.logger.error(`Erro ao criar exportação: ${error.message}`);
      throw error;
    }
  }

  private async processExport(
    exportId: string,
    filters: ExportFilters,
    format: 'csv' | 'json'
  ) {
    try {
      // Buscar dados baseado nos filtros
      const data = await this.getDataForExport(filters);
      
      // Gerar arquivo
      const result = await this.generateFile(exportId, data, format);
      
      // Atualizar registro de exportação
      await this.prisma.export.update({
        where: { id: exportId },
        data: {
          status: 'COMPLETED',
          fileUrl: result.fileUrl,
          fileSize: result.fileSize,
        },
      });

      this.logger.log(`Exportação ${exportId} concluída com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao processar exportação ${exportId}: ${error.message}`);
      
      await this.prisma.export.update({
        where: { id: exportId },
        data: {
          status: 'FAILED',
        },
      });
    }
  }

  private async getDataForExport(filters: ExportFilters) {
    const where: any = {};

    // Filtros de diálogo
    if (filters.dialogIds && filters.dialogIds.length > 0) {
      where.dialogId = { in: filters.dialogIds };
    }

    // Filtros de contato
    if (filters.onlyContacts) {
      where.isContact = true;
    }

    // Filtros de data
    if (filters.dateRange) {
      where.createdAt = {
        gte: new Date(filters.dateRange.from),
        lte: new Date(filters.dateRange.to),
      };
    }

    // Busca por texto
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Buscar membros
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

    // Processar dados para exportação
    return members.map(member => {
      const exportData: any = {
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

      // Incluir telefone apenas se solicitado e disponível
      if (filters.includePhones && member.phoneNumber) {
        exportData.phoneNumber = member.phoneNumber;
      }

      return exportData;
    });
  }

  private async generateFile(
    exportId: string,
    data: any[],
    format: 'csv' | 'json'
  ): Promise<{ fileUrl: string; fileSize: number }> {
    const filename = `export_${exportId}_${Date.now()}`;
    
    if (format === 'csv') {
      return this.generateCSV(filename, data);
    } else {
      return this.generateJSON(filename, data);
    }
  }

  private async generateCSV(filename: string, data: any[]): Promise<{ fileUrl: string; fileSize: number }> {
    const filePath = path.join(this.exportsDir, `${filename}.csv`);
    
    if (data.length === 0) {
      // Criar arquivo vazio com headers
      const headers = Object.keys(data[0] || {}).map(key => ({ id: key, title: key }));
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: headers,
      });
      await csvWriter.writeRecords([]);
    } else {
      const headers = Object.keys(data[0]).map(key => ({ id: key, title: key }));
      const csvWriter = createObjectCsvWriter({
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

  private async generateJSON(filename: string, data: any[]): Promise<{ fileUrl: string; fileSize: number }> {
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

  async getExports(userId: string, page = 1, limit = 20) {
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

  async getExport(exportId: string, userId: string) {
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

  async deleteExport(exportId: string, userId: string) {
    const exportRecord = await this.prisma.export.findFirst({
      where: { 
        id: exportId,
        createdById: userId,
      },
    });

    if (!exportRecord) {
      throw new Error('Exportação não encontrada');
    }

    // Remover arquivo físico se existir
    if (exportRecord.fileUrl) {
      const filePath = path.join(this.exportsDir, path.basename(exportRecord.fileUrl));
      try {
        await fs.remove(filePath);
      } catch (error) {
        this.logger.warn(`Arquivo não encontrado para remoção: ${filePath}`);
      }
    }

    // Remover registro do banco
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
        // Remover arquivo físico
        if (exportRecord.fileUrl) {
          const filePath = path.join(this.exportsDir, path.basename(exportRecord.fileUrl));
          await fs.remove(filePath);
        }

        // Atualizar status
        await this.prisma.export.update({
          where: { id: exportRecord.id },
          data: { status: 'EXPIRED' },
        });

        this.logger.log(`Exportação expirada limpa: ${exportRecord.id}`);
      } catch (error) {
        this.logger.error(`Erro ao limpar exportação expirada ${exportRecord.id}: ${error.message}`);
      }
    }
  }
}
