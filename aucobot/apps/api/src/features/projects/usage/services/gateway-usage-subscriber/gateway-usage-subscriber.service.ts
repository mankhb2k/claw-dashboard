import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';

import { PrismaService } from '../../../../../core/database/prisma.service';
import { WorkspaceService } from '../../../workspace/services/workspace/workspace.service';
import { parseWsFrame } from '../../lib/parse-ws-frame';
import { ModelUsageRecorderService } from '../model-usage-recorder/model-usage-recorder.service';
import { openGatewayUpstream } from '@aucobot/control-plane-core';
import { ProjectStatus } from '@aucobot/database';
import { isOssRuntime, type GatewayEndpoint } from '@aucobot/runtime-contracts';
import { resolveOssGatewayEndpoint } from '@aucobot/runtime-oss';

import type { PendingChatRun } from '../../lib/usage-record.types';
import type WebSocket from 'ws';

const DEFAULT_RECONCILE_MS = 60_000;
const MIN_BACKOFF_MS = 2_000;
const MAX_BACKOFF_MS = 30_000;
const GATEWAY_HEALTH_TIMEOUT_MS = 3_000;

function wsBaseToHealthUrl(wsBaseUrl: string): string {
  const base = wsBaseUrl.trim().replace(/\/$/, '');
  if (base.startsWith('ws://')) {
    return `http://${base.slice('ws://'.length)}`;
  }
  if (base.startsWith('wss://')) {
    return `https://${base.slice('wss://'.length)}`;
  }
  return base;
}

async function isGatewayHealthOk(wsBaseUrl: string): Promise<boolean> {
  const url = `${wsBaseToHealthUrl(wsBaseUrl)}/healthz`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(GATEWAY_HEALTH_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

type ProjectTarget = {
  id: string;
  userId: string;
  gatewayToken: string | null;
};

type ProjectSubscription = {
  upstream: WebSocket;
  pendingRuns: Map<string, PendingChatRun>;
};

type ReconnectState = {
  timer?: NodeJS.Timeout;
  backoffMs: number;
};

@Injectable()
export class GatewayUsageSubscriberService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly log = new Logger(GatewayUsageSubscriberService.name);
  private readonly subscriptions = new Map<string, ProjectSubscription>();
  private readonly targets = new Map<string, ProjectTarget>();
  private readonly reconnect = new Map<string, ReconnectState>();
  private reconcileTimer?: NodeJS.Timeout;
  private shuttingDown = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
    private readonly usageRecorder: ModelUsageRecorderService,
  ) {}

  onModuleInit(): void {
    if (!this.isEnabled()) {
      return;
    }

    void this.reconcileAll();
    this.reconcileTimer = setInterval(
      () => void this.reconcileAll(),
      this.reconcileIntervalMs(),
    );
  }

  onApplicationShutdown(): void {
    this.shuttingDown = true;

    if (this.reconcileTimer) {
      clearInterval(this.reconcileTimer);
      this.reconcileTimer = undefined;
    }

    for (const projectId of [...this.subscriptions.keys()]) {
      this.stopSubscription(projectId);
    }

    for (const state of this.reconnect.values()) {
      if (state.timer) {
        clearTimeout(state.timer);
      }
    }
    this.reconnect.clear();
    this.targets.clear();
  }

  /** Reconcile RUNNING projects with active upstream listeners. Exposed for tests. */
  async reconcileAll(): Promise<void> {
    if (!this.isEnabled() || this.shuttingDown) {
      return;
    }

    const running = await this.prisma.project.findMany({
      where: { status: ProjectStatus.RUNNING },
      select: { id: true, userId: true, gatewayToken: true },
    });
    const runningIds = new Set(running.map((project) => project.id));

    for (const projectId of [...this.subscriptions.keys()]) {
      if (!runningIds.has(projectId)) {
        this.stopSubscription(projectId);
      }
    }

    for (const projectId of [...this.targets.keys()]) {
      if (!runningIds.has(projectId)) {
        this.targets.delete(projectId);
        this.clearReconnect(projectId);
      }
    }

    for (const project of running) {
      this.targets.set(project.id, project);
      if (
        !this.subscriptions.has(project.id) &&
        !this.reconnect.get(project.id)?.timer
      ) {
        await this.connectProject(project);
      }
    }
  }

  private isEnabled(): boolean {
    if (!isOssRuntime()) {
      return false;
    }

    const flag = process.env.USAGE_SUBSCRIBER_ENABLED?.trim().toLowerCase();
    return flag !== 'false' && flag !== '0';
  }

  private reconcileIntervalMs(): number {
    const raw = process.env.USAGE_SUBSCRIBER_RECONCILE_MS?.trim();
    if (!raw) {
      return DEFAULT_RECONCILE_MS;
    }

    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 5_000
      ? parsed
      : DEFAULT_RECONCILE_MS;
  }

  private async connectProject(project: ProjectTarget): Promise<void> {
    if (this.shuttingDown || this.subscriptions.has(project.id)) {
      return;
    }

    this.clearReconnect(project.id);

    let endpoint: GatewayEndpoint;
    try {
      endpoint = resolveOssGatewayEndpoint(project);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.warn(`Skip usage subscribe for ${project.id}: ${message}`);
      this.scheduleReconnect(project.id);
      return;
    }

    let projectDataDir: string;
    try {
      projectDataDir = await this.workspace.ensureProjectLayout(project.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.warn(`Workspace layout failed for ${project.id}: ${message}`);
      this.scheduleReconnect(project.id);
      return;
    }

    try {
      if (!(await isGatewayHealthOk(endpoint.wsBaseUrl))) {
        this.log.debug(
          `Gateway health check pending for ${project.id} (${endpoint.wsBaseUrl})`,
        );
        this.scheduleReconnect(project.id);
        return;
      }

      const upstream = await openGatewayUpstream(
        endpoint.wsBaseUrl,
        endpoint.token,
        projectDataDir,
      );
      const pendingRuns = new Map<string, PendingChatRun>();

      upstream.on('message', (data) => {
        const frame = parseWsFrame(data);
        if (!frame) {
          return;
        }

        this.usageRecorder.tapGatewayFrame({
          projectId: project.id,
          userId: project.userId,
          frame,
          pendingRuns,
          projectDataDir,
        });
      });

      upstream.on('close', () => {
        this.subscriptions.delete(project.id);
        if (!this.shuttingDown && this.targets.has(project.id)) {
          this.scheduleReconnect(project.id);
        }
      });

      upstream.on('error', () => {
        try {
          upstream.close();
        } catch {
          /* ignore */
        }
      });

      this.subscriptions.set(project.id, { upstream, pendingRuns });
      this.reconnect.delete(project.id);
      this.log.log(`Usage subscriber connected for project ${project.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.warn(
        `Usage subscriber connect failed for ${project.id} (${endpoint.wsBaseUrl}): ${message}`,
      );
      this.scheduleReconnect(project.id);
    }
  }

  private scheduleReconnect(projectId: string): void {
    if (this.shuttingDown || !this.targets.has(projectId)) {
      return;
    }
    if (
      this.subscriptions.has(projectId) ||
      this.reconnect.get(projectId)?.timer
    ) {
      return;
    }

    const state = this.reconnect.get(projectId) ?? {
      backoffMs: MIN_BACKOFF_MS,
    };
    const project = this.targets.get(projectId);
    if (!project) {
      return;
    }

    state.timer = setTimeout(() => {
      state.timer = undefined;
      void this.connectProject(project);
    }, state.backoffMs);

    state.backoffMs = Math.min(state.backoffMs * 2, MAX_BACKOFF_MS);
    this.reconnect.set(projectId, state);
  }

  private clearReconnect(projectId: string): void {
    const state = this.reconnect.get(projectId);
    if (state?.timer) {
      clearTimeout(state.timer);
    }
    this.reconnect.delete(projectId);
  }

  private stopSubscription(projectId: string): void {
    this.clearReconnect(projectId);

    const sub = this.subscriptions.get(projectId);
    if (!sub) {
      return;
    }

    try {
      sub.upstream.removeAllListeners();
      if (sub.upstream.readyState === sub.upstream.OPEN) {
        sub.upstream.close(1000, 'usage subscriber stopped');
      }
    } catch {
      /* ignore */
    }

    this.subscriptions.delete(projectId);
    this.log.log(`Usage subscriber stopped for project ${projectId}`);
  }
}
