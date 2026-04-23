import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
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
    if (subscription?.plan) return subscription.plan;
    return this.getFreePlan();
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

  // Throws ForbiddenException if not Pro, ConflictException if daily quota exhausted.
  // Returns the plan so callers can access heavyJobsPerDay etc.
  async assertHeavyJobQuota(userId: string) {
    const plan = await this.getPlanForUser(userId);

    if (plan.name !== 'pro') {
      throw new ForbiddenException(
        'Heavy jobs only available on Pro plan. Upgrade to access FFmpeg, Playwright, TTS/STT.',
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const jobsToday = await this.prisma.heavyJob.count({
      where: {
        userId,
        status: { in: ['PROCESSING', 'DONE'] },
        submittedAt: { gte: today },
      },
    });

    if (jobsToday >= plan.heavyJobsPerDay) {
      throw new ConflictException(
        `Daily heavy job limit (${plan.heavyJobsPerDay}) reached.`,
      );
    }

    return plan;
  }

  private async getFreePlan() {
    const plan = await this.prisma.plan.findUnique({ where: { name: 'free' } });
    if (!plan) throw new BadRequestException('Free plan not configured. Run db seed first.');
    return plan;
  }
}
