import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import { AppModule } from './app.module.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(fastifyCors, {
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:3000',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await app.register(fastifyCookie);

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');

  try {
    const url = await app.getUrl();
    Logger.log(`Listening on ${url}`, 'Bootstrap');
  } catch {
    Logger.log(`Listening on port ${port}`, 'Bootstrap');
  }
}
bootstrap();
