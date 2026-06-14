import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/database/prisma.module';
import { McpInternalController } from './mcp-internal.controller';
import { McpServiceSecretGuard } from './mcp-service-secret.guard';

@Module({
  imports: [PrismaModule],
  controllers: [McpInternalController],
  providers: [McpServiceSecretGuard],
})
export class InternalModule {}
