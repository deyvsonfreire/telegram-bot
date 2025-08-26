import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramTdlibService } from '../telegram-tdlib.service';
export declare class CollectMembersProcessor {
    private prisma;
    private tdlibService;
    private readonly logger;
    constructor(prisma: PrismaService, tdlibService: TelegramTdlibService);
    handleCollectMembers(job: Job): Promise<{
        success: boolean;
        count: number;
    }>;
}
