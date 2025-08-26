import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
interface TDLibSession {
    id: string;
    phoneNumber: string;
    apiId: string;
    apiHash: string;
    encryptedSession?: string;
}
export declare class TelegramTdlibService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private clients;
    private sessions;
    private readonly dbPath;
    private readonly filesPath;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private ensureDirectories;
    createSession(sessionData: TDLibSession): Promise<void>;
    private handleUpdate;
    private handleAuthorizationState;
    private handleError;
    setPhoneNumber(sessionId: string, phoneNumber: string): Promise<void>;
    setCode(sessionId: string, code: string): Promise<void>;
    setPassword(sessionId: string, password: string): Promise<void>;
    getChats(sessionId: string, limit?: number): Promise<any[]>;
    getChatMembers(sessionId: string, chatId: number, limit?: number): Promise<any[]>;
    getContacts(sessionId: string): Promise<any[]>;
    isSessionReady(sessionId: string): Promise<boolean>;
    closeSession(sessionId: string): Promise<void>;
}
export {};
