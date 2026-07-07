import { Injectable, NotFoundException } from '@nestjs/common';

import { GatewayRpcService } from '../../../gateway/services/gateway-rpc/gateway-rpc.service';

type NodeListResponse = {
  ts?: number;
  nodes: Array<Record<string, unknown>>;
};

type DevicePairingList = {
  pending: Array<Record<string, unknown>>;
  paired: Array<Record<string, unknown>>;
};

type NodePairingPending = Record<string, unknown> & {
  requiredApproveScopes?: string[];
};

type NodePairingList = {
  pending: NodePairingPending[];
  paired: Array<Record<string, unknown>>;
};

type NodesPairingResponse = {
  devices: DevicePairingList;
  nodes: NodePairingList;
};

function redactPairedNode(
  entry: Record<string, unknown>,
): Record<string, unknown> {
  const { token: _token, ...rest } = entry;
  return rest;
}

function isUnknownPairingTargetError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /unknown deviceId|unknown node/i.test(msg);
}

function redactDeviceTokens(
  entry: Record<string, unknown>,
): Record<string, unknown> {
  const tokens = entry.tokens;
  if (!tokens || typeof tokens !== 'object') {
    return entry;
  }
  const summarized: Record<string, unknown> = {};
  for (const [role, value] of Object.entries(
    tokens as Record<string, unknown>,
  )) {
    if (!value || typeof value !== 'object') {
      continue;
    }
    const row = value as Record<string, unknown>;
    summarized[role] = {
      role: row.role ?? role,
      scopes: row.scopes,
      createdAtMs: row.createdAtMs,
      rotatedAtMs: row.rotatedAtMs,
      revokedAtMs: row.revokedAtMs,
      lastUsedAtMs: row.lastUsedAtMs,
    };
  }
  return { ...entry, tokens: summarized };
}

@Injectable()
export class NodesService {
  constructor(private readonly gateway: GatewayRpcService) {}

  async list(userId: string, projectId: string): Promise<NodeListResponse> {
    const res = await this.gateway.call<NodeListResponse>(
      userId,
      projectId,
      'node.list',
      {},
    );
    return {
      ts: res.ts,
      nodes: Array.isArray(res.nodes) ? res.nodes : [],
    };
  }

  async getPairing(
    userId: string,
    projectId: string,
  ): Promise<NodesPairingResponse> {
    const [devices, nodes] = await Promise.all([
      this.gateway.call<DevicePairingList>(
        userId,
        projectId,
        'device.pair.list',
        {},
      ),
      this.gateway.call<NodePairingList>(
        userId,
        projectId,
        'node.pair.list',
        {},
      ),
    ]);

    return {
      devices: {
        pending: Array.isArray(devices.pending) ? devices.pending : [],
        paired: (Array.isArray(devices.paired) ? devices.paired : []).map(
          redactDeviceTokens,
        ),
      },
      nodes: {
        pending: Array.isArray(nodes.pending) ? nodes.pending : [],
        paired: (Array.isArray(nodes.paired) ? nodes.paired : []).map(
          redactPairedNode,
        ),
      },
    };
  }

  async approveDevicePairing(
    userId: string,
    projectId: string,
    requestId: string,
  ): Promise<Record<string, unknown>> {
    const res = await this.gateway.call<Record<string, unknown>>(
      userId,
      projectId,
      'device.pair.approve',
      { requestId },
    );
    if (res.device && typeof res.device === 'object') {
      return {
        ...res,
        device: redactDeviceTokens(res.device as Record<string, unknown>),
      };
    }
    return res;
  }

  async rejectDevicePairing(
    userId: string,
    projectId: string,
    requestId: string,
  ): Promise<Record<string, unknown>> {
    return this.gateway.call(userId, projectId, 'device.pair.reject', {
      requestId,
    });
  }

  async approveNodePairing(
    userId: string,
    projectId: string,
    requestId: string,
  ): Promise<Record<string, unknown>> {
    const res = await this.gateway.call<Record<string, unknown>>(
      userId,
      projectId,
      'node.pair.approve',
      { requestId },
    );
    if (res.node && typeof res.node === 'object') {
      return {
        ...res,
        node: redactPairedNode(res.node as Record<string, unknown>),
      };
    }
    return res;
  }

  async rejectNodePairing(
    userId: string,
    projectId: string,
    requestId: string,
  ): Promise<Record<string, unknown>> {
    return this.gateway.call(userId, projectId, 'node.pair.reject', {
      requestId,
    });
  }

  async removeNode(
    userId: string,
    projectId: string,
    nodeId: string,
  ): Promise<Record<string, unknown>> {
    const id = nodeId.trim();
    let removed = false;
    let lastError: unknown;

    try {
      await this.gateway.call(userId, projectId, 'device.pair.remove', {
        deviceId: id,
      });
      removed = true;
    } catch (err) {
      lastError = err;
      if (!isUnknownPairingTargetError(err)) {
        throw err;
      }
    }

    try {
      const res = await this.gateway.call<Record<string, unknown>>(
        userId,
        projectId,
        'node.pair.remove',
        { nodeId: id },
      );
      removed = true;
      return res;
    } catch (err) {
      lastError = err;
      if (!isUnknownPairingTargetError(err)) {
        throw err;
      }
    }

    if (!removed) {
      throw new NotFoundException(
        lastError instanceof Error
          ? lastError.message
          : 'Node or device not found on gateway',
      );
    }

    return { ok: true };
  }

  async renameNode(
    userId: string,
    projectId: string,
    nodeId: string,
    displayName: string,
  ): Promise<Record<string, unknown>> {
    return this.gateway.call(userId, projectId, 'node.rename', {
      nodeId,
      displayName: displayName.trim(),
    });
  }
}
