"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const jwt_1 = require("@nestjs/jwt");
const auth_service_1 = require("./auth.service");
const users_service_1 = require("../users/users.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
describe('AuthService', () => {
    let service;
    let usersService;
    let jwtService;
    let prismaService;
    const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const mockUsersService = {
        findByEmail: jest.fn(),
        findById: jest.fn(),
    };
    const mockJwtService = {
        sign: jest.fn(),
    };
    const mockPrismaService = {
        user: {
            create: jest.fn(),
            update: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: users_service_1.UsersService,
                    useValue: mockUsersService,
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        usersService = module.get(users_service_1.UsersService);
        jwtService = module.get(jwt_1.JwtService);
        prismaService = module.get(prisma_service_1.PrismaService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('register', () => {
        const registerDto = {
            email: 'test@example.com',
            name: 'Test User',
            password: 'password123',
            confirmPassword: 'password123',
            role: 'USER',
        };
        it('should register a new user successfully', async () => {
            mockUsersService.findByEmail.mockResolvedValue(null);
            mockPrismaService.user.create.mockResolvedValue(mockUser);
            mockJwtService.sign.mockReturnValue('jwt-token');
            const result = await service.register(registerDto);
            expect(result.access_token).toBe('jwt-token');
            expect(result.user.email).toBe(registerDto.email);
            expect(mockPrismaService.user.create).toHaveBeenCalled();
        });
        it('should throw ConflictException if user already exists', async () => {
            mockUsersService.findByEmail.mockResolvedValue(mockUser);
            await expect(service.register(registerDto)).rejects.toThrow(common_1.ConflictException);
        });
        it('should throw BadRequestException if passwords do not match', async () => {
            const invalidDto = { ...registerDto, confirmPassword: 'different' };
            await expect(service.register(invalidDto)).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('login', () => {
        const loginDto = {
            email: 'test@example.com',
            password: 'password123',
        };
        it('should login successfully with valid credentials', async () => {
            mockUsersService.findByEmail.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            mockJwtService.sign.mockReturnValue('jwt-token');
            const result = await service.login(loginDto);
            expect(result.access_token).toBe('jwt-token');
            expect(result.user.email).toBe(loginDto.email);
        });
        it('should throw UnauthorizedException if user not found', async () => {
            mockUsersService.findByEmail.mockResolvedValue(null);
            await expect(service.login(loginDto)).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should throw UnauthorizedException if password is invalid', async () => {
            mockUsersService.findByEmail.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
            await expect(service.login(loginDto)).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
    describe('validateUser', () => {
        it('should return user without password if credentials are valid', async () => {
            mockUsersService.findByEmail.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            const result = await service.validateUser('test@example.com', 'password123');
            expect(result.password).toBeUndefined();
            expect(result.email).toBe(mockUser.email);
        });
        it('should return null if user not found', async () => {
            mockUsersService.findByEmail.mockResolvedValue(null);
            const result = await service.validateUser('test@example.com', 'password123');
            expect(result).toBeNull();
        });
        it('should return null if password is invalid', async () => {
            mockUsersService.findByEmail.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
            const result = await service.validateUser('test@example.com', 'password123');
            expect(result).toBeNull();
        });
    });
    describe('getProfile', () => {
        it('should return user profile without password', async () => {
            mockUsersService.findById.mockResolvedValue(mockUser);
            const result = await service.getProfile('1');
            expect(result.email).toBe(mockUser.email);
            expect(result.name).toBe(mockUser.name);
        });
        it('should throw UnauthorizedException if user not found', async () => {
            mockUsersService.findById.mockResolvedValue(null);
            await expect(service.getProfile('1')).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map