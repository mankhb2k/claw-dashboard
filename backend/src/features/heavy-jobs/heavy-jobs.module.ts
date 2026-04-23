import { Module, OnModuleInit } from '@nestjs/common';
import { HeavyJobsService } from './heavy-jobs.service';
import { HeavyJobsController } from './heavy-jobs.controller';
import { MockHeavyWorkerService } from './mock-heavy-worker.service';
import { PrismaModule } from '../../core/database/prisma.module';
import { QueueModule } from '../../core/queue/queue.module';
import { AuthModule } from '../../core/auth/auth.module';
import { BillingModule } from '../../core/billing/billing.module';

@Module({
  imports: [PrismaModule, QueueModule, AuthModule, BillingModule],
  controllers: [HeavyJobsController],
  providers: [HeavyJobsService, MockHeavyWorkerService],
  exports: [HeavyJobsService],
})
export class HeavyJobsModule implements OnModuleInit {
  constructor(private mockHeavyWorker: MockHeavyWorkerService) {}

  async onModuleInit() {
    await this.mockHeavyWorker.initializeMockWorker();
  }
}
