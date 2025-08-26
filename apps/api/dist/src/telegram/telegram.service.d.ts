import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramTdlibService } from './telegram-tdlib.service';
import { CreateSessionInput } from '@telegram-manager/shared';
export declare class TelegramService {
    private prisma;
    private tdlibService;
    private telegramQueue;
    private readonly logger;
    constructor(prisma: PrismaService, tdlibService: TelegramTdlibService, telegramQueue: Queue);
    createSession(data: CreateSessionInput, userId: string): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.SessionType;
        label: string;
        phoneNumber: string | null;
        status: import(".prisma/client").$Enums.SessionStatus;
        encryptedSession: string | null;
        apiId: string | null;
        apiHash: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
    }>;
    getSessions(userId: string): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.SessionType;
        label: string;
        phoneNumber: string | null;
        status: import(".prisma/client").$Enums.SessionStatus;
        encryptedSession: string | null;
        apiId: string | null;
        apiHash: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
    }[]>;
    verifySession(sessionId: string, code: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getDialogs(sessionId: string): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.DialogType;
        createdAt: Date;
        updatedAt: Date;
        telegramId: bigint;
        title: string;
        username: string | null;
        memberCount: number | null;
        lastSyncAt: Date;
        sessionId: string;
    }[]>;
    syncDialogs(sessionId: string, userId: string): Promise<{
        success: boolean;
        count: number;
        dialogs: any[];
    }>;
    private mapTelegramType;
    getMembers(dialogId: string, page?: number, limit?: number): Promise<{
        members: {
            id: string;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
            telegramId: bigint;
            username: string | null;
            firstName: string | null;
            lastName: string | null;
            isContact: boolean;
            isBot: boolean;
            isDeleted: boolean;
            lastSeen: Date | null;
            dialogId: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    startCollectMembers(dialogId: string, userId: string): Promise<{
        jobId: import("bull").JobId;
    }>;
    getJobs(userId: string, page?: number, limit?: number): Promise<{
        jobs: ({
            dialog: {
                id: string;
                type: import(".prisma/client").$Enums.DialogType;
                createdAt: Date;
                updatedAt: Date;
                telegramId: bigint;
                title: string;
                username: string | null;
                memberCount: number | null;
                lastSyncAt: Date;
                sessionId: string;
            };
            session: {
                id: string;
                type: import(".prisma/client").$Enums.SessionType;
                label: string;
                phoneNumber: string | null;
                status: import(".prisma/client").$Enums.SessionStatus;
                encryptedSession: string | null;
                apiId: string | null;
                apiHash: string | null;
                createdAt: Date;
                updatedAt: Date;
                createdById: string;
            };
        } & {
            error: string | null;
            id: string;
            type: import(".prisma/client").$Enums.JobType;
            status: import(".prisma/client").$Enums.JobStatus;
            createdAt: Date;
            updatedAt: Date;
            createdById: string;
            result: import("@prisma/client/runtime/library").JsonValue | null;
            sessionId: string | null;
            dialogId: string | null;
            payload: import("@prisma/client/runtime/library").JsonValue;
            startedAt: Date | null;
            finishedAt: Date | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    syncContacts(sessionId: string, userId: string): Promise<{
        success: boolean;
        count: number;
        contacts: any[];
    }>;
}
