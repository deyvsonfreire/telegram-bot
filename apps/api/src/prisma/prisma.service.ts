import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      // Só conectar se não estivermos em modo de teste
      if (process.env.NODE_ENV !== 'test') {
        await this.$connect();
        console.log('✅ Conectado ao banco de dados PostgreSQL');
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível conectar ao banco de dados:', error.message);
      console.warn('⚠️ A aplicação continuará funcionando, mas algumas funcionalidades podem não estar disponíveis');
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      console.log('✅ Desconectado do banco de dados PostgreSQL');
    } catch (error) {
      console.warn('⚠️ Erro ao desconectar do banco de dados:', error.message);
    }
  }
}
