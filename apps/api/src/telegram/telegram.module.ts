import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { CollectMembersProcessor } from './processors/collect-members.processor';
import { TelegramTdlibService } from './telegram-tdlib.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'telegram-jobs',
    }),
  ],
  controllers: [TelegramController],
  providers: [TelegramService, TelegramTdlibService, CollectMembersProcessor],
  exports: [TelegramService],
})
export class TelegramModule {}
