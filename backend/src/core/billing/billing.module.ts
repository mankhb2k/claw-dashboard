import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { BillingService } from './billing.service';
import { PlanGateService } from './plan-gate.service';

@Module({
  imports: [PrismaModule],
  providers: [BillingService, PlanGateService],
  exports: [BillingService, PlanGateService],
})
export class BillingModule {}
