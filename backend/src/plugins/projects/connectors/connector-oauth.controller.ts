import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { ProjectConnectorsService } from './project-connectors.service';

@ApiTags('connectors-oauth')
@Controller('connectors/oauth')
export class ConnectorOAuthController {
  constructor(private readonly connectors: ProjectConnectorsService) {}

  /** Google OAuth callback — public (state JWT xác thực). */
  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() reply: FastifyReply,
  ) {
    const frontend = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');

    if (error || !code || !state) {
      return reply.redirect(
        `${frontend}/dashboard/connect?oauth_error=${encodeURIComponent(error ?? 'missing_code')}`,
      );
    }

    try {
      const { redirectUrl } = await this.connectors.handleOAuthCallback(code, state);
      return reply.redirect(redirectUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'oauth_failed';
      return reply.redirect(
        `${frontend}/dashboard/connect?oauth_error=${encodeURIComponent(message)}`,
      );
    }
  }
}
