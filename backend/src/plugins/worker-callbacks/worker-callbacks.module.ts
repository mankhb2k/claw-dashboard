import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { WorkerCallbacksController } from './worker-callbacks.controller';

@Module({
  imports: [ProjectsModule, SchedulerModule],
  controllers: [WorkerCallbacksController],
})
export class WorkerCallbacksModule {}
