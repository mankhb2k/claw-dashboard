import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ProjectsService } from '../../../services/projects/projects.service';
import { WorkspaceService } from '../../../workspace/services/workspace/workspace.service';
import { callGatewayRpc, GatewayRpcError } from '@aucobot/control-plane-core';

@Injectable()
export class GatewayRpcService {
  private readonly log = new Logger(GatewayRpcService.name);

  constructor(
    private readonly projects: ProjectsService,
    private readonly workspace: WorkspaceService,
  ) {}

  async call<T = unknown>(
    userId: string,
    projectId: string,
    method: string,
    params?: unknown,
  ): Promise<T> {
    const runtime = await this.projects.getRuntimeForChat(userId, projectId);
    if (!runtime.ready) {
      throw new ServiceUnavailableException({
        code: runtime.reason,
        message: 'Project gateway is not available',
      });
    }

    const projectDataDir = await this.workspace.ensureProjectLayout(projectId);
    try {
      return await callGatewayRpc<T>(
        runtime.gatewayWsUrl,
        runtime.gatewayToken,
        projectDataDir,
        method,
        params,
      );
    } catch (err) {
      if (err instanceof GatewayRpcError) {
        this.log.warn(`Gateway RPC ${method} failed: ${err.message}`);
        throw new ServiceUnavailableException(err.message);
      }
      throw err;
    }
  }
}
