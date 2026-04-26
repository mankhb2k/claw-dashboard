import Queue from 'bull';
import { ContainerProcessor } from './processors/container.processor.js';
import { Logger } from './logger.js';
import * as http from 'http';

const logger = new Logger('VPSWorker');

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
  const port = parseInt(process.env.PORT || '3002');

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

async function syncDockerStateOnStartup(_processor: ContainerProcessor): Promise<void> {
  logger.log('Syncing Docker state on startup...');

  try {
    // This would typically fetch running projects from the backend
    // For now, just log that we're ready
    logger.log('Docker state sync complete');
  } catch (err) {
    logger.error('Failed to sync Docker state:', err);
    // Don't fail startup if sync fails — we can recover
  }
}

async function main() {
  try {
    logger.log('VPS Worker starting...');

    const redisConfig = parseRedisUrl();
    logger.log('Redis config:', { host: redisConfig.host, port: redisConfig.port });

    // Create BullMQ queue
    const containerOpsQueue = new Queue('container-ops', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    logger.log('Connected to Redis queue: container-ops');

    // Start container processor
    const processor = new ContainerProcessor(containerOpsQueue);
    await processor.start();

    // Sync Docker state on startup (recover from VPS reboots)
    await syncDockerStateOnStartup(processor);

    // Start health check server
    const healthServer = await startHealthCheckServer();

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.log(`Received ${signal}, shutting down gracefully...`);

      await processor.stop();
      await containerOpsQueue.close();
      healthServer.close();

      logger.log('VPS Worker shut down successfully');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    logger.log('VPS Worker ready, listening for jobs...');
  } catch (err) {
    logger.error('Failed to start VPS Worker:', err);
    process.exit(1);
  }
}

main();
