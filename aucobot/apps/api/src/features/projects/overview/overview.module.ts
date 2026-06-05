import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../../core/auth/auth.module';
import { ProjectsModule } from '../projects.module';
import { OverviewController } from './overview.controller';
import { OverviewService } from './overview.service';

@Module({
  imports: [AuthModule, forwardRef(() => ProjectsModule)],
  controllers: [OverviewController],
  providers: [OverviewService],
  exports: [OverviewService],
})
export class OverviewModule {}
