import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  try {
    const url = await app.getUrl();
    Logger.log(`Listening on ${url}`, 'Bootstrap');
  } catch (err) {
    Logger.log(`Listening on port ${port}`, 'Bootstrap');
  }
}
bootstrap();
