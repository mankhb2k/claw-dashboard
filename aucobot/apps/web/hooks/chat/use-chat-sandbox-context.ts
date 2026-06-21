'use client';

import { useEffect, useState } from 'react';

import { projectApi } from '@/lib/api/project';
import {
  resolveEffectiveSandboxActive,
  SANDBOX_STAGING_MAX_BYTES,
} from '@/utils/chat/sandbox-staging-limit';

export type ChatSandboxContext = {
  sandboxActive: boolean;
  stagingMaxBytes: number;
  loading: boolean;
};

export function useChatSandboxContext(
  projectId: string,
  agentId: string,
): ChatSandboxContext {
  const fetchKey = projectId ? `${projectId}:${agentId}` : null;
  const [trackedFetchKey, setTrackedFetchKey] = useState<string | null>(null);
  const [sandboxActive, setSandboxActive] = useState(false);
  const [loading, setLoading] = useState(false);

  if (fetchKey !== trackedFetchKey) {
    setTrackedFetchKey(fetchKey);
    if (fetchKey) {
      setLoading(true);
    } else {
      setSandboxActive(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!projectId) return undefined;

    let active = true;

    void (async () => {
      try {
        const projectSandbox = await projectApi.getProjectSandbox(projectId).catch(() => ({
          enabled: false,
          mode: 'all' as const,
          exemptAgentSlugs: [] as string[],
          appliedAgentSlugs: [] as string[],
          agents: [],
        }));

        if (!active) return;

        const agentSlug = agentId || 'main';

        setSandboxActive(
          resolveEffectiveSandboxActive({
            agentSlug,
            sandboxExempt: projectSandbox.exemptAgentSlugs.includes(agentSlug),
            sandboxApplied: projectSandbox.appliedAgentSlugs.includes(agentSlug),
            projectSandboxDefaultEnabled: projectSandbox.enabled,
            projectSandboxDefaultMode: projectSandbox.mode,
          }),
        );
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [projectId, agentId]);

  return {
    sandboxActive,
    stagingMaxBytes: SANDBOX_STAGING_MAX_BYTES,
    loading,
  };
}
