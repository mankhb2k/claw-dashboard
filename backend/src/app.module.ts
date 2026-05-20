import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingModule } from './core/logging/logging.module';
import { PrismaModule } from './core/database/prisma.module';
import { SecretCryptoModule } from './core/crypto/secret-crypto.module';
import { AuthModule } from './core/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { ProjectSecretsModule } from './modules/project-secrets/project-secrets.module';
import { DbHealthMiddleware } from './core/common/middleware/db-health.middleware';

@Module({
  imports: [
    LoggingModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-only-change-me-in-env',
      signOptions: {
        expiresIn: Number(process.env.JWT_ACCESS_SECONDS ?? '900') || 900,
      },
    }),
    PrismaModule,
    SecretCryptoModule,
    AuthModule,
    ProjectsModule,
    WorkspaceModule,
    ProjectSecretsModule,
  ],
  controllers: [AppController],
  providers: [AppService, DbHealthMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DbHealthMiddleware).forRoutes('*');
  }
}
