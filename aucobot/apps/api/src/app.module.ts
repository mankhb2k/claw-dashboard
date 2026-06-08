import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getJwtSecret, accessMaxAgeSec } from '@aucobot/control-plane-core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingModule } from './core/logging/logging.module';
import { PrismaModule } from './core/database/prisma.module';
import { AuthModule } from './core/auth/auth.module';
import { UsersModule } from './core/users/users.module';
import { ProjectsModule } from './features/projects/projects.module';
import { ChatModule } from './features/projects/chat/chat.module';
import { CronModule } from './features/projects/cron/cron.module';
import { HeartbeatModule } from './features/projects/heartbeat/heartbeat.module';
import { SandboxModule } from './features/projects/sandbox/sandbox.module';
import { NodesModule } from './features/projects/nodes/nodes.module';
import { OverviewModule } from './features/projects/overview/overview.module';
import { DbHealthMiddleware } from './core/common/middleware/db-health.middleware';

@Module({
  imports: [
    LoggingModule,
    JwtModule.register({
      global: true,
      secret: getJwtSecret(),
      signOptions: {
        expiresIn: accessMaxAgeSec(),
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    ChatModule,
    CronModule,
    HeartbeatModule,
    SandboxModule,
    NodesModule,
    OverviewModule,
  ],
  controllers: [AppController],
  providers: [AppService, DbHealthMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DbHealthMiddleware).forRoutes('*');
  }
}
