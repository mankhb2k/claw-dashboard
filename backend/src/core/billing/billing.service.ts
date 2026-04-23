import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  async upsertSubscription(userId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException(`Plan not found: ${planId}`);

    return this.prisma.subscription.upsert({
      where: { userId },
      create: { userId, planId, status: 'ACTIVE' },
      update: { planId, status: 'ACTIVE' },
      include: { plan: true },
    });
  }
}
