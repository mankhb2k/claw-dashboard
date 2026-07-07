import { BadRequestException, NotFoundException } from '@nestjs/common';

import { resolveProvider } from '../../ai-providers/lib/provider-registry';
import { decryptSecret } from '@claw-dashboard/control-plane-core';

import type { PrismaService } from '../../../../core/database/prisma.service';

export async function getDecryptedProviderKey(
  prisma: PrismaService,
  projectId: string,
  providerId: string,
  options: {
    isSupported: (id: string) => boolean;
    unsupportedMessage: string;
    testFailureHint?: string;
  },
): Promise<string> {
  const provider = resolveProvider(providerId);
  if (!provider) {
    throw new BadRequestException(`Unknown provider: ${providerId}`);
  }
  if (!options.isSupported(provider.id)) {
    throw new BadRequestException(options.unsupportedMessage);
  }

  const row = await prisma.projectProviderKey.findUnique({
    where: {
      projectId_providerId: { projectId, providerId: provider.id },
    },
  });
  if (!row) {
    throw new NotFoundException('NO_PROVIDER_KEY');
  }
  if (!row.enabled) {
    throw new BadRequestException('PROVIDER_DISABLED');
  }
  if (row.lastTestOk === false) {
    throw new BadRequestException(
      row.lastError ??
        options.testFailureHint ??
        'Provider key failed last test',
    );
  }

  return decryptSecret(row.ciphertext);
}
