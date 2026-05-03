import { Module, forwardRef } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AuthModule } from '../../core/auth/auth.module';
import { CommonModule } from '../../core/common/common.module';
import { QueueModule } from '../../core/queue/queue.module';
import { BillingModule } from '../../core/billing/billing.module';
import { SlugService } from '../../core/common/slug/slug.service';
import { ProjectSecretsService } from './project-secrets.service';

@Module({
  imports: [AuthModule, CommonModule, forwardRef(() => QueueModule), BillingModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectSecretsService, SlugService],
  exports: [ProjectsService, ProjectSecretsService],
})
export class ProjectsModule {}
