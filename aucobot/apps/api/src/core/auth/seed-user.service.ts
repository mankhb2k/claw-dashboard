import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ensureSelfHostDefaultUser } from '@aucobot/control-plane-core';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SeedUserService implements OnModuleInit {
  private readonly log = new Logger(SeedUserService.name);

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
