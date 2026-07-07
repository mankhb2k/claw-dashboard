import { forwardRef, Module } from '@nestjs/common';

import { ProjectsModule } from '../projects.module';
import { ConnectorsCatalogController } from './connectors-catalog.controller';
import { ConnectorsOAuthController } from './connectors-oauth.controller';
import { ConnectorsController } from './connectors.controller';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ProjectConnectorsService } from './services/project-connectors/project-connectors.service';

@Module({
  imports: [WorkspaceModule, forwardRef(() => ProjectsModule)],
  controllers: [
    ConnectorsCatalogController,
    ConnectorsController,
    ConnectorsOAuthController,
  ],
  providers: [ProjectConnectorsService],
  exports: [ProjectConnectorsService],
})
export class ConnectorsModule {}
