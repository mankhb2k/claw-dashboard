import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { QueueConsumerService } from './queue-consumer.service';

const getRedisConfig = () => {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    // Parse redis://[:password@]host[:port]
    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port || '6379'),
        password: url.password,
      };
    } catch (e) {
      console.error('Invalid REDIS_URL format:', e instanceof Error ? e.message : String(e));
    }
  }

  // Fallback to individual env vars
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  };
};

@Module({
  imports: [
    BullModule.forRoot({
      redis: getRedisConfig(),
    }),
    BullModule.registerQueue(
      { name: 'container-ops' },
      { name: 'heavy-tasks' },
    ),
  ],
  providers: [QueueService, QueueConsumerService],
  exports: [QueueService],
})
export class QueueModule {}
