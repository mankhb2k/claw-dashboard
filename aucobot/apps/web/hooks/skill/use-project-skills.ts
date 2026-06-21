"use client";

import { useCallback, useEffect, useState } from "react";

import { projectApi } from "@/lib/api/project";
import { translate } from '@/lib/i18n/translate'

import type {
  ProjectSkillDetail,
  ProjectSkillListRow,
} from "@/schemas/project.schema";

type UseProjectSkillsOptions = {
  enabled?: boolean;
};

export function useProjectSkills(
  projectId: string,
  options?: UseProjectSkillsOptions,
) {
  const active = options?.enabled ?? true;
  const fetchKey = active && projectId ? projectId : null;
  const [trackedFetchKey, setTrackedFetchKey] = useState<string | null>(null);
  const [skills, setSkills] = useState<ProjectSkillListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (fetchKey !== trackedFetchKey) {
    setTrackedFetchKey(fetchKey);
    if (fetchKey) {
      setLoading(true);
      setError(null);
    } else {
      setSkills([]);
      setLoading(false);
      setError(null);
    }
  }

  const refresh = useCallback(async () => {
    await Promise.resolve();
    if (!projectId) {
      setSkills([]);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const rows = await projectApi.listSkills(projectId);
      setSkills(rows);
    } catch (err) {
      setSkills([]);
      setError(err instanceof Error ? err.message : translate('skills.errors.loadList'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!active || !projectId) return undefined;

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      try {
        const rows = await projectApi.listSkills(projectId);
        if (!cancelled) setSkills(rows);
      } catch (err) {
        if (!cancelled) {
          setSkills([]);
          setError(
            err instanceof Error ? err.message : translate('skills.errors.loadList'),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active, projectId]);

  const create = useCallback(
    async (input: {
      slug: string;
      name: string;
      description: string;
      heading?: string;
      bodyMarkdown?: string;
      enabled?: boolean;
    }): Promise<ProjectSkillDetail> => {
      const created = await projectApi.createSkill(projectId, input);
      await refresh();
      return created;
    },
    [projectId, refresh],
  );

  const update = useCallback(
    async (
      slug: string,
      input: {
        name?: string;
        description?: string;
        heading?: string | null;
        bodyMarkdown?: string;
        enabled?: boolean;
      },
    ): Promise<ProjectSkillDetail> => {
      const updated = await projectApi.updateSkill(projectId, slug, input);
      await refresh();
      return updated;
    },
    [projectId, refresh],
  );

  const setEnabled = useCallback(
    async (slug: string, enabled: boolean): Promise<ProjectSkillDetail> => {
      const result = await projectApi.setSkillEnabled(projectId, slug, enabled);
      setSkills((prev) => prev.map((s) => (s.slug === slug ? result : s)));
      return result;
    },
    [projectId],
  );

  const remove = useCallback(
    async (slug: string): Promise<void> => {
      await projectApi.deleteSkill(projectId, slug);
      setSkills((prev) => prev.filter((s) => s.slug !== slug));
    },
    [projectId],
  );

  return {
    skills,
    loading,
    error,
    refresh,
    create,
    update,
    setEnabled,
    remove,
    setSkills,
  };
}
