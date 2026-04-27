import {
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreditTransactionType, HeavyTool } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { PlanGateService } from './plan-gate.service';

const CREDIT_COST_MAP: Record<HeavyTool, number> = {
  PLAYWRIGHT: 1,
  TTS: 1,
  STT: 2,
  FFMPEG_SHORT: 3,
  FFMPEG_LONG: 8,
};

@Injectable()
export class CreditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planGate: PlanGateService,
  ) {}

  getCost(tool: HeavyTool): number {
    return CREDIT_COST_MAP[tool];
  }

  async getWallet(userId: string) {
    await this.planGate.getPlanForUser(userId);
    return this.getOrCreateWallet(userId);
  }

  async listTransactions(userId: string, take = 50) {
    await this.planGate.getPlanForUser(userId);
    return this.prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async consumeForHeavyJob(userId: string, tool: HeavyTool, heavyJobId: string, description: string) {
    const plan = await this.planGate.getPlanForUser(userId);
    const cost = this.getCost(tool);
    if (plan.name !== 'pro') {
      throw new ForbiddenException('Heavy jobs require Pro plan.');
    }

    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.userCredits.findUnique({ where: { userId } });
      if (!wallet) {
        throw new HttpException('Credit wallet not found. Please retry later.', 402);
      }
      const total = wallet.monthlyBalance + wallet.purchasedBalance;
      if (total < cost) {
        throw new HttpException('Insufficient credits', 402);
      }

      const deductMonthly = Math.min(wallet.monthlyBalance, cost);
      const deductPurchased = cost - deductMonthly;
      const newMonthly = wallet.monthlyBalance - deductMonthly;
      const newPurchased = wallet.purchasedBalance - deductPurchased;
      const balanceAfter = newMonthly + newPurchased;

      await tx.userCredits.update({
        where: { userId },
        data: {
          monthlyBalance: newMonthly,
          purchasedBalance: newPurchased,
          totalUsed: { increment: cost },
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          type: CreditTransactionType.USAGE,
          amount: -cost,
          balanceAfter,
          description,
          heavyJobId,
        },
      });
    });

    return cost;
  }

  async refundForHeavyJob(userId: string, heavyJobId: string, amount: number, description: string) {
    if (amount <= 0) return;
    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.userCredits.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Credit wallet not found');

      const updated = await tx.userCredits.update({
        where: { userId },
        data: {
          monthlyBalance: { increment: amount },
        },
      });
      const balanceAfter = updated.monthlyBalance + updated.purchasedBalance;

      await tx.creditTransaction.create({
        data: {
          userId,
          type: CreditTransactionType.REFUND,
          amount,
          balanceAfter,
          description,
          heavyJobId,
        },
      });
    });
  }

  async grantMonthly(userId: string, credits: number, resetAt?: Date | null) {
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.userCredits.upsert({
        where: { userId },
        create: {
          userId,
          monthlyBalance: credits,
          purchasedBalance: 0,
          monthlyResetAt: resetAt ?? null,
          totalGranted: credits,
        },
        update: {
          monthlyBalance: credits,
          monthlyResetAt: resetAt ?? null,
          totalGranted: { increment: credits },
        },
      });
      const balanceAfter = current.monthlyBalance + current.purchasedBalance;
      await tx.creditTransaction.create({
        data: {
          userId,
          type: CreditTransactionType.MONTHLY_GRANT,
          amount: credits,
          balanceAfter,
          description: 'Monthly subscription grant',
        },
      });
    });
  }

  async getOrCreateWallet(userId: string) {
    const plan = await this.planGate.getPlanForUser(userId);
    return this.prisma.userCredits.upsert({
      where: { userId },
      create: {
        userId,
        monthlyBalance: 0,
        purchasedBalance: 0,
        monthlyResetAt: null,
      },
      update: {},
    }).then(async (wallet) => {
      if (wallet.monthlyBalance === 0 && plan.monthlyCredits > 0 && !wallet.monthlyResetAt) {
        await this.grantMonthly(userId, plan.monthlyCredits, null);
        return this.prisma.userCredits.findUniqueOrThrow({ where: { userId } });
      }
      return wallet;
    });
  }
}
