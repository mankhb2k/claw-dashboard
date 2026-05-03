import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger as NestLogger, ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger as PinoNestLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './core/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './core/common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );
  app.useLogger(app.get(PinoNestLogger));

  await app.register(fastifyCors, {
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:3000',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(fastifyCookie);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OpenClaw API')
    .setDescription('Control Plane API — Auth · Projects · Heavy Tasks · Internal')
    .setVersion('1.0')
    .addCookieAuth('better-auth.session_token')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'Authorization' }, 'worker-secret')
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
    NestLogger.log(`Swagger UI: ${url}/api/docs`, 'Bootstrap');
  } catch {
    NestLogger.log(`Listening on port ${port}`, 'Bootstrap');
  }
}
bootstrap();
