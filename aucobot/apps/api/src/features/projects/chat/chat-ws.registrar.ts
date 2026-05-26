import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  extractAccessTokenFromRequest,
  verifyAccessToken,
} from '@aucobot/control-plane-core';
import { ProjectsService } from '../projects.service';
import { ChatGatewayProxyService } from './chat.gateway-proxy.service';

@Injectable()
export class ChatWsRegistrar implements OnApplicationBootstrap {
  private readonly log = new Logger(ChatWsRegistrar.name);

  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly projects: ProjectsService,
    private readonly proxy: ChatGatewayProxyService,
  ) {}

  onApplicationBootstrap(): void {
    const fastify = this.adapterHost.httpAdapter.getInstance() as FastifyInstance;
    if (!fastify.hasPlugin('@fastify/websocket')) {
      this.log.warn('@fastify/websocket not loaded — chat proxy disabled');
      return;
    }

    fastify.get(
      '/api/projects/:projectId/chat/ws',
      { websocket: true },
      (socket, req: FastifyRequest<{ Params: { projectId: string } }>) => {
        void this.handleConnection(socket, req);
      },
    );
    this.log.log('Chat WebSocket proxy: GET /api/projects/:projectId/chat/ws');
  }

  private async handleConnection(
    socket: import('@fastify/websocket').WebSocket,
    req: FastifyRequest<{ Params: { projectId: string } }>,
  ): Promise<void> {
    const projectId = req.params?.projectId?.trim();
    if (!projectId) {
      socket.close(1008, 'missing project id');
      return;
    }

    const token = extractAccessTokenFromRequest(req);
    const user = verifyAccessToken(token);
    if (!user) {
      socket.close(1008, 'unauthorized');
      return;
    }

    let runtime: Awaited<ReturnType<ProjectsService['getRuntimeForChat']>>;
    try {
      runtime = await this.projects.getRuntimeForChat(user.sub, projectId);
    } catch {
      socket.close(1008, 'project not found');
      return;
    }

    if (!runtime.ready) {
      socket.close(1013, 'project not running');
      return;
    }

    await this.proxy.bridge({
      client: socket as unknown as import('ws').WebSocket,
      projectId,
      gatewayWsUrl: runtime.gatewayWsUrl,
      gatewayToken: runtime.gatewayToken,
    });
  }
}
