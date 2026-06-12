"use client";

import { useCallback, useEffect, useState } from "react";
import { projectApi } from "@/lib/api/project";
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
  const [skills, setSkills] = useState<ProjectSkillListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
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
      setError(err instanceof Error ? err.message : "Could not load skills");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!active || !projectId) return;
    void refresh();
  }, [active, projectId, refresh]);

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

  const syncAll = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    const result = await projectApi.syncAllSkills(projectId);
    await refresh();
    return result;
  }, [projectId, refresh]);

  return {
    skills,
    loading,
    error,
    refresh,
    create,
    update,
    setEnabled,
    remove,
    syncAll,
    setSkills,
  };
}
