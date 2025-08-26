import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider('PrismaService')
    .useValue({
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      user: { findUnique: jest.fn() },
      telegramSession: { findMany: jest.fn() },
      dialog: { findMany: jest.fn() },
      member: { findMany: jest.fn(), count: jest.fn() },
      job: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
      export: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(404); // A aplicação não tem rota raiz, então esperamos 404
  });
});
