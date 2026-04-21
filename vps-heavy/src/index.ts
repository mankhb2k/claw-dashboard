import Queue from 'bull';
import { HeavyProcessor } from './processors/heavy.processor.ts';
import { Logger } from './logger.ts';
import * as http from 'http';

const logger = new Logger('VPSHeavy');

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

function parseRedisUrl(): RedisConfig {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port || '6379'),
        password: url.password,
      };
    } catch (err) {
      logger.error('Invalid REDIS_URL format:', err);
    }
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  };
}

async function startHealthCheckServer(): Promise<http.Server> {
  const port = parseInt(process.env.PORT || '3003');

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(port, () => {
      logger.log(`Health check server running on port ${port}`);
      resolve(server);
    });
  });
}

async function main() {
  try {
    logger.log('VPS Heavy starting...');

    const redisConfig = parseRedisUrl();
    logger.log('Redis config:', { host: redisConfig.host, port: redisConfig.port });

    // Create BullMQ queue
    const heavyTasksQueue = new Queue('heavy-tasks', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 1,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    logger.log('Connected to Redis queue: heavy-tasks');

    // Start heavy processor
    const processor = new HeavyProcessor(heavyTasksQueue);
    await processor.start();

    // Start health check server
    const healthServer = await startHealthCheckServer();

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.log(`Received ${signal}, shutting down gracefully...`);

      await processor.stop();
      await heavyTasksQueue.close();
      healthServer.close();

      logger.log('VPS Heavy shut down successfully');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    logger.log('VPS Heavy ready, listening for jobs...');
  } catch (err) {
    logger.error('Failed to start VPS Heavy:', err);
    process.exit(1);
  }
}

main();
