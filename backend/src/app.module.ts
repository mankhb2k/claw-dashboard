import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { QueueModule } from './queue/queue.module';
import { InternalModule } from './internal/internal.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { HeavyJobsModule } from './heavy-jobs/heavy-jobs.module';
import { DbHealthMiddleware } from './common/middleware/db-health.middleware';

@Module({
  imports: [PrismaModule, QueueModule, AuthModule, ProjectsModule, InternalModule, SubscriptionsModule, SchedulerModule, HeavyJobsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DbHealthMiddleware).forRoutes('*');
  }
}
