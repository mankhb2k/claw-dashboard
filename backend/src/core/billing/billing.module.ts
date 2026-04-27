import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { BillingService } from './billing.service';
import { PlanGateService } from './plan-gate.service';
import { CreditService } from './credit.service';

@Module({
  imports: [PrismaModule],
  providers: [BillingService, PlanGateService, CreditService],
  exports: [BillingService, PlanGateService, CreditService],
})
export class BillingModule {}
