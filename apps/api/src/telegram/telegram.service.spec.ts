import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramTdlibService } from './telegram-tdlib.service';

describe('TelegramService', () => {
  let service: TelegramService;
  let prismaService: PrismaService;
  let tdlibService: TelegramTdlibService;
  let queue: any;

  const mockPrismaService = {
    telegramSession: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    dialog: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    member: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    job: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockTdlibService = {
    createSession: jest.fn(),
    isSessionReady: jest.fn(),
    getChats: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TelegramTdlibService,
          useValue: mockTdlibService,
        },
        {
          provide: getQueueToken('telegram-jobs'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
    prismaService = module.get<PrismaService>(PrismaService);
    tdlibService = module.get<TelegramTdlibService>(TelegramTdlibService);
    queue = module.get(getQueueToken('telegram-jobs'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    const createSessionData = {
      type: 'user' as const,
      label: 'Test Session',
      phoneNumber: '+1234567890',
      apiId: '12345',
      apiHash: 'hash123',
    };

    it('should create a session successfully', async () => {
      const mockSession = { id: '1', ...createSessionData };
      mockPrismaService.telegramSession.create.mockResolvedValue(mockSession);
      mockTdlibService.createSession.mockResolvedValue(undefined);

      const result = await service.createSession(createSessionData, 'user1');

      expect(result).toEqual(mockSession);
      expect(mockPrismaService.telegramSession.create).toHaveBeenCalledWith({
        data: {
          type: 'USER',
          label: createSessionData.label,
          phoneNumber: createSessionData.phoneNumber,
          apiId: createSessionData.apiId,
          apiHash: createSessionData.apiHash,
          createdById: 'user1',
        },
      });
      expect(mockTdlibService.createSession).toHaveBeenCalled();
    });

    it('should not initialize TDLib for bot sessions', async () => {
      const botSessionData = { ...createSessionData, type: 'bot' as const };
      const mockSession = { id: '1', ...botSessionData };
      mockPrismaService.telegramSession.create.mockResolvedValue(mockSession);

      const result = await service.createSession(botSessionData, 'user1');

      expect(result).toEqual(mockSession);
      expect(mockTdlibService.createSession).not.toHaveBeenCalled();
    });
  });

  describe('getSessions', () => {
    it('should return user sessions', async () => {
      const mockSessions = [
        { id: '1', label: 'Session 1' },
        { id: '2', label: 'Session 2' },
      ];
      mockPrismaService.telegramSession.findMany.mockResolvedValue(mockSessions);

      const result = await service.getSessions('user1');

      expect(result).toEqual(mockSessions);
      expect(mockPrismaService.telegramSession.findMany).toHaveBeenCalledWith({
        where: { createdById: 'user1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getDialogs', () => {
    it('should return dialogs for a session', async () => {
      const mockDialogs = [
        { id: '1', title: 'Dialog 1' },
        { id: '2', title: 'Dialog 2' },
      ];
      mockPrismaService.dialog.findMany.mockResolvedValue(mockDialogs);

      const result = await service.getDialogs('session1');

      expect(result).toEqual(mockDialogs);
      expect(mockPrismaService.dialog.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session1' },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('syncDialogs', () => {
    it('should sync dialogs successfully', async () => {
      mockTdlibService.isSessionReady.mockResolvedValue(true);
      mockTdlibService.getChats.mockResolvedValue([
        { id: 123, title: 'Chat 1', type: 'chatTypeSupergroup' },
      ]);
      mockPrismaService.dialog.upsert.mockResolvedValue({ id: '1', title: 'Chat 1' });
      mockPrismaService.job.create.mockResolvedValue({ id: 'job1' });

      const result = await service.syncDialogs('session1', 'user1');

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(mockTdlibService.getChats).toHaveBeenCalledWith('session1');
      expect(mockPrismaService.job.create).toHaveBeenCalled();
    });

    it('should throw error if session is not ready', async () => {
      mockTdlibService.isSessionReady.mockResolvedValue(false);

      await expect(service.syncDialogs('session1', 'user1')).rejects.toThrow(
        'Sessão TDLib não está pronta'
      );
    });
  });

  describe('getMembers', () => {
    it('should return members with pagination', async () => {
      const mockMembers = [
        { id: '1', firstName: 'User 1' },
        { id: '2', firstName: 'User 2' },
      ];
      mockPrismaService.member.findMany.mockResolvedValue(mockMembers);
      mockPrismaService.member.count.mockResolvedValue(2);

      const result = await service.getMembers('dialog1', 1, 10);

      expect(result.members).toEqual(mockMembers);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('startCollectMembers', () => {
    it('should start member collection job', async () => {
      const mockDialog = { id: '1', title: 'Dialog 1', telegramId: BigInt(123) };
      mockPrismaService.dialog.findUnique.mockResolvedValue(mockDialog);
      mockQueue.add.mockResolvedValue({ id: 'job1' });
      mockPrismaService.job.create.mockResolvedValue({ id: 'job1' });

      const result = await service.startCollectMembers('dialog1', 'user1');

      expect(result.jobId).toBe('job1');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'collect-members',
        {
          dialogId: 'dialog1',
          telegramDialogId: 123n,
          dialogTitle: 'Dialog 1',
          userId: 'user1',
        },
        expect.any(Object)
      );
    });

    it('should throw error if dialog not found', async () => {
      mockPrismaService.dialog.findUnique.mockResolvedValue(null);

      await expect(
        service.startCollectMembers('dialog1', 'user1')
      ).rejects.toThrow('Diálogo não encontrado');
    });
  });

  describe('getJobs', () => {
    it('should return jobs with pagination', async () => {
      const mockJobs = [
        { id: '1', type: 'COLLECT_MEMBERS' },
        { id: '2', type: 'SYNC_DIALOGS' },
      ];
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);
      mockPrismaService.job.count.mockResolvedValue(2);

      const result = await service.getJobs('user1', 1, 10);

      expect(result.jobs).toEqual(mockJobs);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });
});
