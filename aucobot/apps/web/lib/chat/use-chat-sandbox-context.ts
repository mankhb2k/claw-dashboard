'use client';

import { useEffect, useState } from 'react';
import { projectApi } from '@/lib/api/project';
import { resolveEffectiveSandboxActive, SANDBOX_STAGING_MAX_BYTES } from './sandbox-staging-limit';

export type ChatSandboxContext = {
  sandboxActive: boolean;
  stagingMaxBytes: number;
  loading: boolean;
};

export function useChatSandboxContext(
  projectId: string,
  agentId: string,
): ChatSandboxContext {
  const [sandboxActive, setSandboxActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setSandboxActive(false);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    void (async () => {
      try {
        const [projectSandbox, agentDetail] = await Promise.all([
          projectApi.getProjectSandbox(projectId).catch(() => ({
            enabled: false,
            mode: 'non-main' as const,
          })),
          agentId && agentId !== 'main'
            ? projectApi.getAgent(projectId, agentId).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (!active) return;

        const agentSandboxEnabled =
          agentDetail?.formData?.sandboxEnabled ??
          (agentId === 'main' ? false : undefined);

        setSandboxActive(
          resolveEffectiveSandboxActive({
            agentSlug: agentId || 'main',
            agentSandboxEnabled,
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
