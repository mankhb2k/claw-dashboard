import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Core
import { LoggingModule } from './core/logging/logging.module';
import { PrismaModule } from './core/database/prisma.module';
import { SecretCryptoModule } from './core/crypto/secret-crypto.module';
import { AuthModule } from './core/auth/auth.module';
import { QueueModule } from './core/queue/queue.module';
import { BillingModule } from './core/billing/billing.module';
import { DbHealthMiddleware } from './core/common/middleware/db-health.middleware';
// Plugins
import { ProjectsModule } from './plugins/projects/projects.module';
import { HeavyJobsModule } from './plugins/heavy-jobs/heavy-jobs.module';
import { SchedulerModule } from './plugins/scheduler/scheduler.module';
import { WorkerCallbacksModule } from './plugins/worker-callbacks/worker-callbacks.module';
import { CreditsModule } from './plugins/credits/credits.module';

@Module({
  imports: [
    // Core — infrastructure, always loaded
    LoggingModule,
    EventEmitterModule.forRoot(),
    PrismaModule,
    SecretCryptoModule,
    QueueModule,
    AuthModule,
    BillingModule,
    // plugins — business logic
    ProjectsModule,
    HeavyJobsModule,
    CreditsModule,
    SchedulerModule,
    WorkerCallbacksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DbHealthMiddleware).forRoutes('*');
  }
}
