import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prismaService: any;
  let queueService: any;

  beforeEach(async () => {
    // Mock Prisma
    prismaService = {
      project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      containerInstance: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      plan: {
        findUnique: jest.fn(),
      },
      subscription: {
        findUnique: jest.fn(),
      },
    };

    // Mock Queue
    queueService = {
      enqueueSpawn: jest.fn(),
      enqueueWake: jest.fn(),
      enqueueStop: jest.fn(),
      enqueueDestroy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: QueueService, useValue: queueService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUser', () => {
    it('should list user projects', async () => {
      const userId = 'user-1';
      const mockProjects = [
        { id: 'proj-1', userId, subdomain: 'sub123', status: 'RUNNING', plan: { id: 'free' } },
      ];

      prismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await service.findByUser(userId);

      expect(result).toEqual(mockProjects);
      expect(prismaService.project.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    it('should create project and enqueue spawn job', async () => {
      const userId = 'user-1';
      const mockPlan = { id: 'free-1', name: 'free', maxProjects: 1, cpuVcpu: 0.5, ramMb: 1024 };
      const mockProject = {
        id: 'proj-1',
        userId,
        subdomain: 'abc123de',
        status: 'CREATING',
        plan: mockPlan,
        vpsId: 'vps-1',
      };

      prismaService.subscription.findUnique.mockResolvedValue(null); // No subscription → use free plan
      prismaService.plan.findUnique.mockResolvedValue(mockPlan);
      prismaService.project.count.mockResolvedValue(0);
      prismaService.project.create.mockResolvedValue(mockProject);
      prismaService.containerInstance.create.mockResolvedValue({});

      const result = await service.create(userId);

      expect(result.status).toBe('CREATING');
      expect(queueService.enqueueSpawn).toHaveBeenCalledWith(
        mockProject.id,
        userId,
        expect.any(String),
        'openclaw:latest',
        0.5,
        1024,
      );
    });

    it('should use subscription plan when user has active subscription', async () => {
      const userId = 'user-1';
      const proPlan = { id: 'pro-1', name: 'pro', maxProjects: 10, cpuVcpu: 2, ramMb: 4096 };
      const mockProject = {
        id: 'proj-1',
        userId,
        subdomain: 'abc123de',
        status: 'CREATING',
        plan: proPlan,
        vpsId: 'vps-1',
      };

      prismaService.subscription.findUnique.mockResolvedValue({ userId, planId: proPlan.id, plan: proPlan });
      prismaService.project.count.mockResolvedValue(5); // 5 projects, under pro plan limit of 10
      prismaService.project.create.mockResolvedValue(mockProject);
      prismaService.containerInstance.create.mockResolvedValue({});

      const result = await service.create(userId);

      expect(result.status).toBe('CREATING');
      expect(queueService.enqueueSpawn).toHaveBeenCalledWith(
        mockProject.id,
        userId,
        expect.any(String),
        'openclaw:latest',
        2,
        4096,
      );
    });

    it('should reject if plan limit reached', async () => {
      const userId = 'user-1';
      const mockPlan = { id: 'free-1', name: 'free', maxProjects: 1 };

      prismaService.subscription.findUnique.mockResolvedValue(null);
      prismaService.plan.findUnique.mockResolvedValue(mockPlan);
      prismaService.project.count.mockResolvedValue(1); // Already has 1 project

      await expect(service.create(userId)).rejects.toThrow(ConflictException);
    });

    it('should reject if plan not found', async () => {
      const userId = 'user-1';

      prismaService.subscription.findUnique.mockResolvedValue(null);
      prismaService.plan.findUnique.mockResolvedValue(null);

      await expect(service.create(userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('start', () => {
    it('should start stopped project and enqueue wake job', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';
      const mockProject = {
        id: projectId,
        userId,
        status: 'STOPPED',
        plan: { cpuVcpu: 0.5, ramMb: 1024 },
        vpsId: 'vps-1',
      };

      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.project.update.mockResolvedValue({ status: 'STARTING' });
      prismaService.containerInstance.create.mockResolvedValue({});

      const result = await service.start(projectId, userId);

      expect(result.status).toBe('STARTING');
      expect(queueService.enqueueWake).toHaveBeenCalledWith(projectId, userId);
    });

    it('should return if already running', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';
      const mockProject = {
        id: projectId,
        userId,
        status: 'RUNNING',
      };

      prismaService.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.start(projectId, userId);

      expect(result.status).toBe('RUNNING');
      expect(queueService.enqueueWake).not.toHaveBeenCalled();
    });

    it('should reject if project not found', async () => {
      const projectId = 'proj-999';
      const userId = 'user-1';

      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.start(projectId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should reject if not owner', async () => {
      const projectId = 'proj-1';
      const userId = 'user-wrong';
      const mockProject = {
        id: projectId,
        userId: 'user-1',
        status: 'STOPPED',
      };

      prismaService.project.findUnique.mockResolvedValue(mockProject);

      await expect(service.start(projectId, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('stop', () => {
    it('should stop running project and enqueue stop job', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';
      const mockProject = {
        id: projectId,
        userId,
        status: 'RUNNING',
      };

      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.project.update.mockResolvedValue({ status: 'STOPPED' });
      prismaService.containerInstance.findFirst.mockResolvedValue({
        id: 'inst-1',
        status: 'RUNNING',
      });
      prismaService.containerInstance.update.mockResolvedValue({});

      const result = await service.stop(projectId, userId);

      expect(result.status).toBe('STOPPING');
      expect(queueService.enqueueStop).toHaveBeenCalledWith(projectId, userId);
    });

    it('should return if already stopped', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';
      const mockProject = {
        id: projectId,
        userId,
        status: 'STOPPED',
      };

      prismaService.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.stop(projectId, userId);

      expect(result.status).toBe('STOPPED');
      expect(queueService.enqueueStop).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete stopped project and enqueue destroy job', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';
      const mockProject = {
        id: projectId,
        userId,
        status: 'STOPPED',
      };

      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.project.delete.mockResolvedValue({});

      const result = await service.remove(projectId, userId);

      expect(result.deleted).toBe(true);
      expect(queueService.enqueueDestroy).toHaveBeenCalledWith(projectId, userId);
    });

    it('should reject if project still running', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';
      const mockProject = {
        id: projectId,
        userId,
        status: 'RUNNING',
      };

      prismaService.project.findUnique.mockResolvedValue(mockProject);

      await expect(service.remove(projectId, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getInstances', () => {
    it('should list container instances for project', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';
      const mockProject = { id: projectId, userId };
      const mockInstances = [
        { id: 'inst-1', status: 'RUNNING', createdAt: new Date() },
      ];

      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.containerInstance.findMany.mockResolvedValue(mockInstances);

      const result = await service.getInstances(projectId, userId);

      expect(result).toEqual(mockInstances);
    });
  });

  describe('getHealth', () => {
    it('should return project health status', async () => {
      const projectId = 'proj-1';
      const userId = 'user-1';
      const mockProject = {
        id: projectId,
        userId,
        status: 'RUNNING',
        subdomain: 'abc123de',
        lastActiveAt: new Date(),
        storageUsedMb: 100,
      };

      prismaService.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.getHealth(projectId, userId);

      expect(result).toEqual({
        status: 'RUNNING',
        subdomain: 'abc123de',
        lastActiveAt: mockProject.lastActiveAt,
        storageUsedMb: 100,
      });
    });
  });
});
