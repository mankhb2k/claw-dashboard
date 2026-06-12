import { Module, forwardRef } from '@nestjs/common';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ProjectsModule } from '../projects.module';
import { GatewayRpcService } from './services/gateway-rpc/gateway-rpc.service';

@Module({
  imports: [WorkspaceModule, forwardRef(() => ProjectsModule)],
  providers: [GatewayRpcService],
  exports: [GatewayRpcService],
})
export class GatewayModule {}
