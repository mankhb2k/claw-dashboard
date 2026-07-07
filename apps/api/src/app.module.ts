import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { DbHealthMiddleware } from './core/common/middleware/db-health.middleware';
import { PrismaModule } from './core/database/prisma.module';
import { LoggingModule } from './core/logging/logging.module';
import { UsersModule } from './core/users/users.module';
import { ChatModule } from './features/projects/chat/chat.module';
import { CronModule } from './features/projects/cron/cron.module';
import { ExecPolicyModule } from './features/projects/exec-policy/exec-policy.module';
import { HeartbeatModule } from './features/projects/heartbeat/heartbeat.module';
import { NodesModule } from './features/projects/nodes/nodes.module';
import { OverviewModule } from './features/projects/overview/overview.module';
import { ProjectsModule } from './features/projects/projects.module';
import { SandboxModule } from './features/projects/sandbox/sandbox.module';
import { SkillsModule } from './features/projects/skills/skills.module';
import { UsageModule } from './features/projects/usage/usage.module';
import {
  getJwtSecret,
  accessMaxAgeSec,
} from '@claw-dashboard/control-plane-core';

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
    ExecPolicyModule,
    NodesModule,
    OverviewModule,
    UsageModule,
    SkillsModule,
  ],
  controllers: [AppController],
  providers: [AppService, DbHealthMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DbHealthMiddleware).forRoutes('*');
  }
}
