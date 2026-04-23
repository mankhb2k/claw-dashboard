import {
  Controller,
  All,
  Inject,
  Req,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import type { Auth } from 'better-auth';
import { BETTER_AUTH } from './auth.constants';
import { toHeaders } from './node-headers.util';

@ApiExcludeController()
@Controller('api/auth')
export class AuthController {
  constructor(@Inject(BETTER_AUTH) private readonly auth: Auth) {}

  @All('*')
  async handleAuth(
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const host = req.headers.host ?? 'localhost:3001';
    const protocol = req.protocol ?? 'http';
    const requestUrl = new URL(req.url, `${protocol}://${host}`);
    const headers = toHeaders(req.headers);

    const requestInit: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
      requestInit.body = JSON.stringify(req.body);
    }

    const response = await this.auth.handler(new Request(requestUrl.toString(), requestInit));
    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });
    reply.status(response.status);

    const body = await response.text();
    return body ? reply.send(body) : reply.send();
  }
}
