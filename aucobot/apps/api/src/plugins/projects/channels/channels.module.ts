import { forwardRef, Module } from '@nestjs/common';
import { ProjectsModule } from '../projects.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ChannelsCatalogController } from './channels-catalog.controller';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';

@Module({
  imports: [WorkspaceModule, forwardRef(() => ProjectsModule)],
  controllers: [ChannelsCatalogController, ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
