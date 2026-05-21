import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ensureSelfHostDefaultUser } from './self-host-user';

@Injectable()
export class DefaultUserService implements OnModuleInit {
  private readonly log = new Logger(DefaultUserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try {
      const { login, created } = await ensureSelfHostDefaultUser(this.prisma);
      this.log.log(
        created
          ? `Self-host default user created (login=${login})`
          : `Self-host default user synced from env (login=${login})`,
      );
    } catch (err) {
      this.log.error(
        `Failed to ensure self-host default user: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
