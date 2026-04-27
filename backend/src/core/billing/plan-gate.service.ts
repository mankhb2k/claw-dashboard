import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PlanGateService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlanForUser(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    if (!subscription?.plan) {
      throw new InternalServerErrorException(
        'No active subscription for user. Run Prisma migration backfill (backfill_free_subscriptions) or contact support.',
      );
    }
    return subscription.plan;
  }

  // Throws ConflictException if user is at max projects for their plan.
  // Returns the plan so callers can use it (e.g. to get RAM/CPU limits).
  async assertProjectLimit(userId: string) {
    const plan = await this.getPlanForUser(userId);
    const count = await this.prisma.project.count({ where: { userId } });
    if (count >= plan.maxProjects) {
      throw new ConflictException(
        `Plan allows ${plan.maxProjects} project(s). Upgrade to Pro for more.`,
      );
    }
    return plan;
  }

  // Throws ConflictException if running projects exceed concurrent limit.
  async assertConcurrentRunningLimit(userId: string) {
    const plan = await this.getPlanForUser(userId);
    const runningCount = await this.prisma.project.count({
      where: {
        userId,
        status: { in: ['RUNNING', 'STARTING'] },
      },
    });
    if (runningCount >= plan.maxConcurrentRunning) {
      throw new ConflictException(
        `Plan allows ${plan.maxConcurrentRunning} running project(s) at the same time.`,
      );
    }
    return plan;
  }
}
