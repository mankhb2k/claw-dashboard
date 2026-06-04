import {
  buildHeartbeatSummary,
  mergeHeartbeatIntoConfig,
  resolveAgentHeartbeatEvery,
  validateHeartbeatEvery,
} from '../../../../../../packages/workspace-sync/src/heartbeat-sync';

describe('heartbeat-sync merge', () => {
  const project = {
    heartbeatEnabled: true,
    heartbeatEvery: '30m',
    heartbeatMd: null,
  };

  it('validates preset intervals', () => {
    expect(validateHeartbeatEvery('15m')).toBe('15m');
    expect(() => validateHeartbeatEvery('abc')).toThrow();
  });

  it('patches main only when custom agents are off', () => {
    const config = {
      agents: {
        list: [
          { id: 'main', name: 'Main' },
          { id: 'ops', name: 'Ops' },
        ],
      },
    };

    mergeHeartbeatIntoConfig(config, project, [
      {
        slug: 'ops',
        enabled: true,
        heartbeatMode: 'off',
        heartbeatEvery: null,
        heartbeatMd: null,
      },
    ]);

    const list = (config.agents as { list: Record<string, unknown>[] }).list;
    expect(list[0]?.heartbeat).toMatchObject({ every: '30m', target: 'none' });
    expect(list[1]?.heartbeat).toBeUndefined();
  });

  it('applies inherit and custom agent intervals', () => {
    const config = {
      agents: {
        list: [
          { id: 'main', name: 'Main' },
          { id: 'ops', name: 'Ops' },
          { id: 'alerts', name: 'Alerts' },
        ],
      },
    };

    mergeHeartbeatIntoConfig(config, project, [
      {
        slug: 'ops',
        enabled: true,
        heartbeatMode: 'inherit',
        heartbeatEvery: null,
        heartbeatMd: null,
      },
      {
        slug: 'alerts',
        enabled: true,
        heartbeatMode: 'custom',
        heartbeatEvery: '1h',
        heartbeatMd: null,
      },
    ]);

    const list = (config.agents as { list: Record<string, unknown>[] }).list;
    expect((list[1]?.heartbeat as { every: string }).every).toBe('30m');
    expect((list[2]?.heartbeat as { every: string }).every).toBe('1h');
  });

  it('summarizes agents for UI', () => {
    const summary = buildHeartbeatSummary(project, [
      {
        slug: 'ops',
        name: 'Ops',
        enabled: true,
        heartbeatMode: 'custom',
        heartbeatEvery: '15m',
        heartbeatMd: null,
      },
    ]);
    expect(summary[0]).toMatchObject({ agentId: 'main', enabled: true });
    expect(summary[1]).toMatchObject({ agentId: 'ops', every: '15m' });
  });

  it('inherit follows main when enabled', () => {
    expect(
      resolveAgentHeartbeatEvery(project, {
        slug: 'ops',
        enabled: true,
        heartbeatMode: 'inherit',
        heartbeatEvery: null,
        heartbeatMd: null,
      }),
    ).toBe('30m');
  });
});
