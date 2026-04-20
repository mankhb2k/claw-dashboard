import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { InternalController } from './internal.controller';

@Module({
  imports: [ProjectsModule, SchedulerModule],
  controllers: [InternalController],
})
export class InternalModule {}
