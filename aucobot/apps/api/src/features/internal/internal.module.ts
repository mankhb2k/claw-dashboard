import { Module } from '@nestjs/common';

import { McpInternalController } from './mcp-internal.controller';
import { McpServiceSecretGuard } from './mcp-service-secret.guard';
import { PrismaModule } from '../../core/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [McpInternalController],
  providers: [McpServiceSecretGuard],
})
export class InternalModule {}
