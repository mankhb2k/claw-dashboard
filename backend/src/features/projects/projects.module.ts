import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AuthModule } from '../../core/auth/auth.module';
import { CommonModule } from '../../core/common/common.module';
import { QueueModule } from '../../core/queue/queue.module';
import { BillingModule } from '../../core/billing/billing.module';

@Module({
  imports: [AuthModule, CommonModule, QueueModule, BillingModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
