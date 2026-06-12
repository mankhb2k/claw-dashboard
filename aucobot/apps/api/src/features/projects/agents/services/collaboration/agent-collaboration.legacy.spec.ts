import {
  legacyTeamFormSlice,
  resolveProjectCollaborationSettings,
} from '@aucobot/workspace-sync';

describe('legacy per-agent team migration', () => {
  it('returns disabled collaboration when no legacy team is enabled', () => {
    expect(
      resolveProjectCollaborationSettings({
        stored: { enabled: false, memberSlugs: [] },
        legacyAgents: [
          { slug: 'agent-a', formData: legacyTeamFormSlice({ teamEnabled: false }) },
          {
            slug: 'agent-b',
            formData: legacyTeamFormSlice({
              teamEnabled: false,
              allowedAgentSlugs: ['agent-a'],
            }),
          },
        ],
      }),
    ).toEqual({ enabled: false, memberSlugs: [] });
  });

  it('derives members from legacy team allow lists when stored is empty', () => {
    expect(
      resolveProjectCollaborationSettings({
        stored: { enabled: false, memberSlugs: [] },
        legacyAgents: [
          {
            slug: 'agent-a',
            formData: legacyTeamFormSlice({
              teamEnabled: true,
              allowedAgentSlugs: ['agent-b'],
            }),
          },
          { slug: 'agent-b', formData: legacyTeamFormSlice({}) },
        ],
      }),
    ).toEqual({
      enabled: true,
      memberSlugs: ['agent-a', 'agent-b'],
    });
  });

  it('resolveProjectCollaborationSettings prefers stored project settings', () => {
    expect(
      resolveProjectCollaborationSettings({
        stored: { enabled: true, memberSlugs: ['agent-x'] },
        legacyAgents: [
          {
            slug: 'agent-a',
            formData: legacyTeamFormSlice({
              teamEnabled: true,
              allowedAgentSlugs: ['agent-b'],
            }),
          },
        ],
      }),
    ).toEqual({ enabled: true, memberSlugs: ['agent-x'] });
  });

  it('unions legacy peers when deriving from multiple team-enabled agents', () => {
    const resolved = resolveProjectCollaborationSettings({
      stored: { enabled: false, memberSlugs: [] },
      legacyAgents: [
        {
          slug: 'agent-a',
          formData: legacyTeamFormSlice({
            teamEnabled: true,
            allowedAgentSlugs: ['agent-b', 'agent-c'],
          }),
        },
        { slug: 'agent-b', formData: legacyTeamFormSlice({}) },
      ],
    });
    expect(resolved.enabled).toBe(true);
    expect(resolved.memberSlugs).toEqual(expect.arrayContaining(['agent-a', 'agent-b']));
  });
});
