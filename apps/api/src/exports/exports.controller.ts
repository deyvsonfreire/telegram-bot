import { Controller, Get, Post, Body, Param, Query, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

@ApiTags('Exports')
@Controller('exports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportsController {
  constructor(private exportsService: ExportsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova exportação' })
  async createExport(@Body() createExportDto: CreateExportDto, @Request() req) {
    return this.exportsService.createExport(
      createExportDto.name,
      createExportDto.description || '',
      createExportDto.filters,
      req.user.id,
      createExportDto.format
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar exportações do usuário' })
  async getExports(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.exportsService.getExports(
      req.user.id,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma exportação' })
  async getExport(@Param('id') id: string, @Request() req) {
    return this.exportsService.getExport(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma exportação' })
  async deleteExport(@Param('id') id: string, @Request() req) {
    return this.exportsService.deleteExport(id, req.user.id);
  }
}
