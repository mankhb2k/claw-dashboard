import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { IdleDetectionService } from './idle-detection.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, QueueModule],
  providers: [IdleDetectionService],
  exports: [IdleDetectionService],
})
export class SchedulerModule {}
