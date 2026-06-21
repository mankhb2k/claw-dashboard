import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { McpServiceSecretGuard } from './mcp-service-secret.guard';
import { PrismaService } from '../../core/database/prisma.service';
import { decryptSecret } from '@aucobot/control-plane-core';
import { ConnectorConnectionStatus } from '@aucobot/database';

@ApiExcludeController()
@Controller('internal/mcp')
@UseGuards(McpServiceSecretGuard)
export class McpInternalController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('projects/:projectId/connectors/:slug/secrets')
  async getConnectorSecrets(
    @Param('projectId') projectId: string,
    @Param('slug') slug: string,
  ): Promise<{ secrets: Record<string, string> }> {
    const connectorSlug = slug.trim().toLowerCase();
    const row = await this.prisma.projectConnector.findUnique({
      where: {
        projectId_connectorSlug: {
          projectId: projectId.trim(),
          connectorSlug,
        },
      },
      include: { secrets: true },
    });

    if (!row) {
      throw new NotFoundException('Connector not found');
    }

    if (
      !row.enabled ||
      row.connectionStatus !== ConnectorConnectionStatus.CONNECTED
    ) {
      throw new NotFoundException('Connector is not connected');
    }

    const secrets: Record<string, string> = {};
    for (const s of row.secrets) {
      try {
        secrets[s.secretKey] = decryptSecret(s.ciphertext);
      } catch {
        // skip undecryptable
      }
    }

    return { secrets };
  }
}
