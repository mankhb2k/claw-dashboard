import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { HeavyJobsModule } from '../heavy-jobs/heavy-jobs.module';
import { WorkerCallbacksController } from './worker-callbacks.controller';

@Module({
  imports: [ProjectsModule, SchedulerModule, HeavyJobsModule],
  controllers: [WorkerCallbacksController],
})
export class WorkerCallbacksModule {}
