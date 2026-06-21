import { Module, forwardRef } from '@nestjs/common';

import { NodeInvitesPublicController } from './node-invites-public.controller';
import { NodesController } from './nodes.controller';
import { AuthModule } from '../../../core/auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';
import { ProjectsModule } from '../projects.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { NodeInvitesService } from './services/node-invites/node-invites.service';
import { NodesService } from './services/nodes/nodes.service';

@Module({
  imports: [
    AuthModule,
    WorkspaceModule,
    GatewayModule,
    forwardRef(() => ProjectsModule),
  ],
  controllers: [NodesController, NodeInvitesPublicController],
  providers: [NodesService, NodeInvitesService],
  exports: [NodesService, NodeInvitesService],
})
export class NodesModule {}
