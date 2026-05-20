import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger as NestLogger, ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCors from '@fastify/cors';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger as PinoNestLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './core/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './core/common/filters/http-exception.filter';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET?.trim()) {
    throw new Error('JWT_SECRET is required in production');
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );
  app.useLogger(app.get(PinoNestLogger));
  app.setGlobalPrefix('api');

  await app.register(fastifyCors, {
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:3000',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OpenClaw Control Plane API')
    .setDescription('Phase 1 — JWT · Projects · Workspace revisions · Secrets')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');

  try {
    const url = await app.getUrl();
    NestLogger.log(`Listening on ${url}`, 'Bootstrap');
    NestLogger.log(`Swagger: ${url}/api/docs`, 'Bootstrap');
  } catch {
    NestLogger.log(`Listening on port ${port}`, 'Bootstrap');
  }
}
bootstrap();
