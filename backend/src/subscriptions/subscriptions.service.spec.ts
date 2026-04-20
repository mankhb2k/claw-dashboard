import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      subscription: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      plan: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSubscription', () => {
    it('should return subscription with plan when found', async () => {
      const userId = 'user-1';
      const mockSubscription = {
        id: 'sub-1',
        userId,
        planId: 'plan-1',
        status: 'ACTIVE',
        plan: { id: 'plan-1', name: 'pro', maxProjects: 10, cpuVcpu: 2, ramMb: 4096 },
      };

      prismaService.subscription.findUnique.mockResolvedValue(mockSubscription);

      const result = await service.getSubscription(userId);

      expect(result).toEqual(mockSubscription);
      expect(prismaService.subscription.findUnique).toHaveBeenCalledWith({
        where: { userId },
        include: { plan: true },
      });
    });

    it('should return null when no subscription exists', async () => {
      const userId = 'user-new';

      prismaService.subscription.findUnique.mockResolvedValue(null);

      const result = await service.getSubscription(userId);

      expect(result).toBeNull();
    });
  });

  describe('upsertSubscription', () => {
    it('should create subscription when none exists', async () => {
      const userId = 'user-1';
      const planId = 'pro-plan-1';
      const mockPlan = { id: planId, name: 'pro', maxProjects: 10 };
      const mockSubscription = {
        id: 'sub-1',
        userId,
        planId,
        status: 'ACTIVE',
        plan: mockPlan,
      };

      prismaService.plan.findUnique.mockResolvedValue(mockPlan);
      prismaService.subscription.upsert.mockResolvedValue(mockSubscription);

      const result = await service.upsertSubscription(userId, planId);

      expect(result).toEqual(mockSubscription);
      expect(prismaService.subscription.upsert).toHaveBeenCalledWith({
        where: { userId },
        create: { userId, planId, status: 'ACTIVE' },
        update: { planId, status: 'ACTIVE' },
        include: { plan: true },
      });
    });

    it('should update existing subscription to new plan', async () => {
      const userId = 'user-1';
      const newPlanId = 'pro-plan-1';
      const mockPlan = { id: newPlanId, name: 'pro', maxProjects: 10 };
      const updatedSubscription = {
        id: 'sub-1',
        userId,
        planId: newPlanId,
        status: 'ACTIVE',
        plan: mockPlan,
      };

      prismaService.plan.findUnique.mockResolvedValue(mockPlan);
      prismaService.subscription.upsert.mockResolvedValue(updatedSubscription);

      const result = await service.upsertSubscription(userId, newPlanId);

      expect(result.planId).toBe(newPlanId);
      expect(result.status).toBe('ACTIVE');
    });

    it('should throw NotFoundException when plan not found', async () => {
      const userId = 'user-1';
      const invalidPlanId = 'nonexistent-plan';

      prismaService.plan.findUnique.mockResolvedValue(null);

      await expect(service.upsertSubscription(userId, invalidPlanId)).rejects.toThrow(NotFoundException);
    });
  });
});
