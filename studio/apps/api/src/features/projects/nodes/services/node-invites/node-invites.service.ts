import {
  BadRequestException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../../core/database/prisma.service';
import {
  resolveGatewayEndpoint,
  resolveOssGatewayHttpBase,
  resolveOssGatewayToken,
} from '../../../runtime/gateway-endpoint';
import { ProjectsService } from '../../../services/projects/projects.service';
import {
  generateNodeInviteCode,
  hashNodeInviteCode,
  normalizeNodeInviteCode,
} from '../../lib/node-invite.util';

const DEFAULT_TTL_MINUTES = 15;
const MIN_TTL_MINUTES = 5;
const MAX_TTL_MINUTES = 60;

export type NodeInviteListItem = {
  id: string;
  codePrefix: string;
  label: string | null;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  status: 'active' | 'used' | 'expired';
};

export type CreateNodeInviteResult = {
  invite: NodeInviteListItem;
  code: string;
};

export type RedeemNodeInviteResult = {
  gatewayUrl: string;
  gatewayToken: string;
  clawDashboardWebUrl: string;
  projectId: string;
};

@Injectable()
export class NodeInvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
  ) {}

  async createInvite(
    userId: string,
    projectId: string,
    opts?: { label?: string; ttlMinutes?: number },
  ): Promise<CreateNodeInviteResult> {
    await this.projects.assertOwned(userId, projectId);

    const ttlMinutes = opts?.ttlMinutes ?? DEFAULT_TTL_MINUTES;
    if (ttlMinutes < MIN_TTL_MINUTES || ttlMinutes > MAX_TTL_MINUTES) {
      throw new BadRequestException(
        `ttlMinutes must be between ${MIN_TTL_MINUTES} and ${MAX_TTL_MINUTES}`,
      );
    }

    const { code, codeHash, codePrefix } = generateNodeInviteCode();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    const row = await this.prisma.nodeInvite.create({
      data: {
        projectId,
        codeHash,
        codePrefix,
        label: opts?.label?.trim() || null,
        expiresAt,
      },
    });

    return {
      code,
      invite: this.toListItem(row),
    };
  }

  async listInvites(
    userId: string,
    projectId: string,
  ): Promise<NodeInviteListItem[]> {
    await this.projects.assertOwned(userId, projectId);

    const rows = await this.prisma.nodeInvite.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return rows.map((row) => this.toListItem(row));
  }

  async revokeInvite(
    userId: string,
    projectId: string,
    inviteId: string,
  ): Promise<void> {
    await this.projects.assertOwned(userId, projectId);

    const row = await this.prisma.nodeInvite.findFirst({
      where: { id: inviteId, projectId },
    });
    if (!row) {
      throw new NotFoundException('Invite not found');
    }

    await this.prisma.nodeInvite.delete({ where: { id: inviteId } });
  }

  async redeemInvite(codeRaw: string): Promise<RedeemNodeInviteResult> {
    const code = normalizeNodeInviteCode(codeRaw);
    if (code.length < 12) {
      throw new BadRequestException('Invalid invite code');
    }

    const codeHash = hashNodeInviteCode(code);
    const invite = await this.prisma.nodeInvite.findUnique({
      where: { codeHash },
      include: { project: true },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }
    if (invite.usedAt) {
      throw new GoneException('Invite already used');
    }
    if (invite.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('Invite expired');
    }

    const project = invite.project;
    const gatewayUrl = resolveOssGatewayHttpBase();
    const gatewayToken = resolveOssGatewayToken(project.gatewayToken);
    resolveGatewayEndpoint(project);

    await this.prisma.nodeInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    return {
      gatewayUrl,
      gatewayToken,
      clawDashboardWebUrl: resolveClawDashboardWebUrl(),
      projectId: project.id,
    };
  }

  private toListItem(row: {
    id: string;
    codePrefix: string;
    label: string | null;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
  }): NodeInviteListItem {
    const now = Date.now();
    let status: NodeInviteListItem['status'] = 'active';
    if (row.usedAt) {
      status = 'used';
    } else if (row.expiresAt.getTime() <= now) {
      status = 'expired';
    }

    return {
      id: row.id,
      codePrefix: row.codePrefix,
      label: row.label,
      expiresAt: row.expiresAt.toISOString(),
      usedAt: row.usedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      status,
    };
  }
}

function resolveClawDashboardWebUrl(): string {
  const fromEnv = process.env.FRONTEND_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  return 'http://localhost:8386';
}
