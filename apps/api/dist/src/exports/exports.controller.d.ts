import { ExportsService } from './exports.service';
interface CreateExportDto {
    name: string;
    description?: string;
    filters: {
        dialogIds?: string[];
        includePhones?: boolean;
        onlyContacts?: boolean;
        dateRange?: {
            from: string;
            to: string;
        };
        search?: string;
    };
    format: 'csv' | 'json';
}
export declare class ExportsController {
    private exportsService;
    constructor(exportsService: ExportsService);
    createExport(createExportDto: CreateExportDto, req: any): Promise<import("./exports.service").ExportResult>;
    getExports(req: any, page?: string, limit?: string): Promise<{
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
    getExport(id: string, req: any): Promise<{
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
    deleteExport(id: string, req: any): Promise<{
        message: string;
    }>;
}
export {};
