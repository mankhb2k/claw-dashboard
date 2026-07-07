/** On boot: ensureSelfHostDefaultUser from env */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { ensureSelfHostDefaultUser } from '@claw-dashboard/control-plane-core';

@Injectable()
export class SeedUserService implements OnModuleInit {
  private readonly log = new Logger(SeedUserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try {
      const { username, created } = await ensureSelfHostDefaultUser(
        this.prisma,
      );
      this.log.log(
        created
          ? `Self-host default user created (username=${username})`
          : `Self-host default user synced from env (username=${username})`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.error(`Failed to ensure self-host default user: ${message}`);
    }
  }
}
