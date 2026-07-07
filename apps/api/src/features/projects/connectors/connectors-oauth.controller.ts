import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ProjectConnectorsService } from './services/project-connectors/project-connectors.service';

import type { FastifyReply } from 'fastify';

@ApiTags('connectors-oauth')
@Controller('connectors/oauth')
export class ConnectorsOAuthController {
  constructor(private readonly connectors: ProjectConnectorsService) {}

  /** Google OAuth callback — public (state JWT xác thực). */
  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('relay_code') relayCode: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Query('oauth_error') oauthError: string | undefined,
    @Res() reply: FastifyReply,
  ) {
    const frontend = (
      process.env.FRONTEND_URL ?? 'http://localhost:8386'
    ).replace(/\/$/, '');

    const failure = error ?? oauthError;
    if (failure || !state || (!code && !relayCode)) {
      return reply.redirect(
        `${frontend}/dashboard/connector?oauth_error=${encodeURIComponent(failure ?? 'missing_code')}`,
      );
    }

    try {
      const { redirectUrl } = await this.connectors.handleOAuthCallback(
        code,
        state,
        relayCode,
      );
      return reply.redirect(redirectUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'oauth_failed';
      return reply.redirect(
        `${frontend}/dashboard/connector?oauth_error=${encodeURIComponent(message)}`,
      );
    }
  }
}
