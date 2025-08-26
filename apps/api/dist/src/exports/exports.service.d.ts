import { PrismaService } from '../prisma/prisma.service';
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
export declare class ExportsService {
    private prisma;
    private readonly logger;
    private readonly exportsDir;
    constructor(prisma: PrismaService);
    private ensureExportsDirectory;
    createExport(name: string, description: string, filters: ExportFilters, userId: string, format?: 'csv' | 'json'): Promise<ExportResult>;
    private processExport;
    private getDataForExport;
    private generateFile;
    private generateCSV;
    private generateJSON;
    getExports(userId: string, page?: number, limit?: number): Promise<{
        exports: {
            id: string;
            name: string;
            description: string | null;
            filters: import("@prisma/client/runtime/library").JsonValue;
            fileUrl: string | null;
            fileSize: number | null;
            status: import(".prisma/client").$Enums.ExportStatus;
            expiresAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            createdById: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getExport(exportId: string, userId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        filters: import("@prisma/client/runtime/library").JsonValue;
        fileUrl: string | null;
        fileSize: number | null;
        status: import(".prisma/client").$Enums.ExportStatus;
        expiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
    }>;
    deleteExport(exportId: string, userId: string): Promise<{
        message: string;
    }>;
    cleanupExpiredExports(): Promise<void>;
}
export {};
