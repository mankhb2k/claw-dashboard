import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuthController } from './auth.controller';
import { SessionGuard } from './guards/session.guard';
import { CommonModule } from '../common/common.module';
import { createBetterAuth } from './better-auth';
import { BETTER_AUTH } from './auth.constants';

@Module({
  imports: [CommonModule],
  controllers: [AuthController],
  providers: [
    SessionGuard,
    {
      provide: BETTER_AUTH,
      inject: [PrismaService],
      useFactory: async (prisma: PrismaService) => createBetterAuth(prisma),
    },
  ],
  exports: [BETTER_AUTH, SessionGuard],
})
export class AuthModule {}
