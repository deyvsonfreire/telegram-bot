import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const csrf = require('csurf');
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Segurança básica
  app.use(helmet());

  // Cookies (assinar opcionalmente com COOKIE_SECRET)
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Configuração de CORS (necessário para cookies cross-origin)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    exposedHeaders: [],
  });

  // Validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // CSRF baseado em cookie (double submit cookie)
  const isProd = (process.env.NODE_ENV || 'development') === 'production';
  app.use(
    csrf({
      cookie: {
        httpOnly: true,
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
      },
      value: (req: any) => req.headers['x-csrf-token'] as string || '',
    })
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Telegram Manager API')
    .setDescription('API para gerenciamento de contatos, grupos e canais do Telegram')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API rodando na porta ${port}`);
}

bootstrap();
