import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { getMcpServiceSecret } from '@aucobot/control-plane-core';

@Injectable()
export class McpServiceSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = getMcpServiceSecret();
    if (!secret) {
      throw new UnauthorizedException('MCP internal API is not configured');
    }

    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const header = req.headers['x-mcp-service-secret'];
    const provided = Array.isArray(header) ? header[0] : header;
    if (!provided || provided !== secret) {
      throw new UnauthorizedException('Invalid MCP service secret');
    }
    return true;
  }
}
