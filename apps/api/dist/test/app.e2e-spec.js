"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
describe('AppController (e2e)', () => {
    let app;
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
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
            .expect(404);
    });
});
//# sourceMappingURL=app.e2e-spec.js.map