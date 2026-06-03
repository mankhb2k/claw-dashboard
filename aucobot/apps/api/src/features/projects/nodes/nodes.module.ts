import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../../core/auth/auth.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ProjectsModule } from '../projects.module';
import { GatewayRpcService } from '../gateway/gateway-rpc.service';
import { NodesController } from './nodes.controller';
import { NodeInvitesPublicController } from './node-invites-public.controller';
import { NodesService } from './nodes.service';
import { NodeInvitesService } from './node-invites.service';

@Module({
  imports: [AuthModule, WorkspaceModule, forwardRef(() => ProjectsModule)],
  controllers: [NodesController, NodeInvitesPublicController],
  providers: [GatewayRpcService, NodesService, NodeInvitesService],
  exports: [NodesService, NodeInvitesService, GatewayRpcService],
})
export class NodesModule {}
