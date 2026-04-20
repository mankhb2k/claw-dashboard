import { Module, OnModuleInit } from '@nestjs/common';
import { HeavyJobsService } from './heavy-jobs.service';
import { HeavyJobsController } from './heavy-jobs.controller';
import { MockHeavyWorkerService } from './mock-heavy-worker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, QueueModule, AuthModule],
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
