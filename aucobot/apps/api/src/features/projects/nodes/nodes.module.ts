import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../../core/auth/auth.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ProjectsModule } from '../projects.module';
import { GatewayModule } from '../gateway/gateway.module';
import { NodesController } from './nodes.controller';
import { NodeInvitesPublicController } from './node-invites-public.controller';
import { NodesService } from './services/nodes/nodes.service';
import { NodeInvitesService } from './services/node-invites/node-invites.service';

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
