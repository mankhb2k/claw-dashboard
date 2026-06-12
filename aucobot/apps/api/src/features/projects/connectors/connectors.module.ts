import { forwardRef, Module } from '@nestjs/common';
import { ProjectsModule } from '../projects.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ConnectorsCatalogController } from './connectors-catalog.controller';
import { ConnectorsController } from './connectors.controller';
import { ConnectorsOAuthController } from './connectors-oauth.controller';
import { ProjectConnectorsService } from './services/project-connectors/project-connectors.service';

@Module({
  imports: [WorkspaceModule, forwardRef(() => ProjectsModule)],
  controllers: [ConnectorsCatalogController, ConnectorsController, ConnectorsOAuthController],
  providers: [ProjectConnectorsService],
  exports: [ProjectConnectorsService],
})
export class ConnectorsModule {}
