import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { CreateSessionInput, CollectMembersInput } from '@telegram-manager/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Telegram')
@Controller('telegram')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  @Post('sessions/:sessionId/verify')
  @ApiOperation({ summary: 'Verificar sessão do Telegram com código' })
  async verifySession(
    @Param('sessionId') sessionId: string,
    @Body('code') code: string,
  ) {
    return this.telegramService.verifySession(sessionId, code);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Criar nova sessão do Telegram' })
  async createSession(@Body() data: CreateSessionInput, @Request() req) {
    return this.telegramService.createSession(data, req.user.id);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Listar sessões do usuário' })
  async getSessions(@Request() req) {
    return this.telegramService.getSessions(req.user.id);
  }

  @Get('sessions/:sessionId/dialogs')
  @ApiOperation({ summary: 'Listar diálogos de uma sessão' })
  async getDialogs(@Param('sessionId') sessionId: string) {
    return this.telegramService.getDialogs(sessionId);
  }

  @Post('sessions/:sessionId/sync-dialogs')
  @ApiOperation({ summary: 'Sincronizar diálogos de uma sessão' })
  async syncDialogs(@Param('sessionId') sessionId: string, @Request() req) {
    return this.telegramService.syncDialogs(sessionId, req.user.id);
  }

  @Post('sessions/:sessionId/sync-contacts')
  @ApiOperation({ summary: 'Sincronizar contatos de uma sessão' })
  async syncContacts(@Param('sessionId') sessionId: string, @Request() req) {
    return this.telegramService.syncContacts(sessionId, req.user.id);
  }

  @Get('dialogs/:dialogId/members')
  @ApiOperation({ summary: 'Listar membros de um diálogo' })
  async getMembers(
    @Param('dialogId') dialogId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.telegramService.getMembers(
      dialogId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Post('dialogs/:dialogId/collect-members')
  @ApiOperation({ summary: 'Iniciar coleta de membros' })
  async startCollectMembers(
    @Param('dialogId') dialogId: string,
    @Body() data: CollectMembersInput,
    @Request() req,
  ) {
    return this.telegramService.startCollectMembers(
      dialogId,
      req.user.id,
    );
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Listar jobs do usuário' })
  async getJobs(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.telegramService.getJobs(
      req.user.id,
      parseInt(page),
      parseInt(limit),
    );
  }
}
