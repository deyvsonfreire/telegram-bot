import { TelegramService } from './telegram.service';
import { CreateSessionInput, CollectMembersInput } from '@telegram-manager/shared';
export declare class TelegramController {
    private telegramService;
    constructor(telegramService: TelegramService);
    verifySession(sessionId: string, code: string): Promise<{
        success: boolean;
        message: string;
    }>;
    createSession(data: CreateSessionInput, req: any): Promise<{
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
    getSessions(req: any): Promise<{
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
    syncDialogs(sessionId: string, req: any): Promise<{
        success: boolean;
        count: number;
        dialogs: any[];
    }>;
    syncContacts(sessionId: string, req: any): Promise<{
        success: boolean;
        count: number;
        contacts: any[];
    }>;
    getMembers(dialogId: string, page?: string, limit?: string): Promise<{
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
    startCollectMembers(dialogId: string, data: CollectMembersInput, req: any): Promise<{
        jobId: import("bull").JobId;
    }>;
    getJobs(req: any, page?: string, limit?: string): Promise<{
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
}
