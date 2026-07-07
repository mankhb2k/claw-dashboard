import { Injectable, OnModuleInit } from '@nestjs/common';

import { PrismaClient, createPrismaPgAdapter } from '@claw-dashboard/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({ adapter: createPrismaPgAdapter(process.env.DATABASE_URL!) });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
