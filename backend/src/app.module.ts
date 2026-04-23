import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Core
import { PrismaModule } from './core/database/prisma.module';
import { AuthModule } from './core/auth/auth.module';
import { QueueModule } from './core/queue/queue.module';
import { BillingModule } from './core/billing/billing.module';
import { DbHealthMiddleware } from './core/common/middleware/db-health.middleware';
// Features
import { ProjectsModule } from './features/projects/projects.module';
import { HeavyJobsModule } from './features/heavy-jobs/heavy-jobs.module';
import { SchedulerModule } from './features/scheduler/scheduler.module';
import { WorkerCallbacksModule } from './features/worker-callbacks/worker-callbacks.module';

@Module({
  imports: [
    // Core — infrastructure, always loaded
    EventEmitterModule.forRoot(),
    PrismaModule,
    QueueModule,
    AuthModule,
    BillingModule,
    // Features — business logic
    ProjectsModule,
    HeavyJobsModule,
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
