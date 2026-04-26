import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AuthModule } from '../../core/auth/auth.module';
import { CommonModule } from '../../core/common/common.module';
import { QueueModule } from '../../core/queue/queue.module';
import { BillingModule } from '../../core/billing/billing.module';
import { SlugService } from '../../core/slug/slug.service';

@Module({
  imports: [AuthModule, CommonModule, QueueModule, BillingModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, SlugService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
