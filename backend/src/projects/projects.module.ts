import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [AuthModule, CommonModule, QueueModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
