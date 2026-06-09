"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useFormContext } from "react-hook-form";
import { Flex } from "@/components/layout";
import { Typography, Switch, Card, Button } from "@/components/ui";
import { Sparkles } from "lucide-react";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type { AgentFormInput } from "@/schemas/agentForm.schema";
import type { ProjectSkillListRow } from "@/schemas/project.schema";
import styles from "./CardSkill.module.css";

export function CardSkill() {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const { watch, setValue } = useFormContext<AgentFormInput>();
  const skillNames = watch("skillNames");

  const [skills, setSkills] = useState<ProjectSkillListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const enabledSkills = useMemo(
    () => skills.filter((skill) => skill.enabled),
    [skills],
  );

  const selectedSet = useMemo(() => new Set(skillNames), [skillNames]);

  const loadSkills = useCallback(async () => {
    if (!projectId) {
      setSkills([]);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await projectApi.listSkills(projectId);
      setSkills(rows);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Cannot load skills");
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadSkills();
  }, [loadSkills]);

  const setSkillEnabled = (skillName: string, enabled: boolean) => {
    const next = enabled
      ? Array.from(new Set([...skillNames, skillName]))
      : skillNames.filter((name) => name !== skillName);
    setValue("skillNames", next, { shouldDirty: true });
  };

  const handleEnableAll = () => {
    const allNames = enabledSkills.map((skill) => skill.name);
    setValue("skillNames", allNames, { shouldDirty: true });
  };

  const handleDisableAll = () => {
    setValue("skillNames", [], { shouldDirty: true });
  };

  return (
    <Card className={styles.card} disableHover>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <Typography variant="p" weight="bold">
              Agent Skills
            </Typography>
            <Typography variant="small" color="muted">
              Only skills you enable here are visible to this agent.
            </Typography>
          </div>
          {enabledSkills.length > 0 ? (
            <div className={styles.actions}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDisableAll}
                disabled={skillNames.length === 0}
              >
                Disable all
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnableAll}
                disabled={skillNames.length === enabledSkills.length}
              >
                Enable all
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {loadError ? (
        <Typography variant="small" className={styles.loadError}>
          {loadError}
        </Typography>
      ) : null}

      {loading ? (
        <Typography variant="small" color="muted">
          Loading skills…
        </Typography>
      ) : enabledSkills.length === 0 ? (
        <div className={styles.emptyState}>
          <Typography variant="small" color="muted">
            No published skills yet.{" "}
            <Link href="/dashboard/skill" className={styles.emptyLink}>
              Create and enable skills
            </Link>{" "}
            in the Skills section first.
          </Typography>
        </div>
      ) : (
        <Flex direction="column" gap={3} className={styles.skillList}>
          {enabledSkills.map((skill) => (
            <div key={skill.slug} className={styles.skillRow}>
              <div className={styles.skillMain}>
                <span className={styles.skillIconWrap} aria-hidden>
                  <Sparkles size={20} />
                </span>
                <div className={styles.skillCopy}>
                  <Typography variant="p" weight="medium">
                    {skill.name}
                  </Typography>
                  <Typography variant="small" color="muted">
                    {skill.description.trim() || skill.slug}
                  </Typography>
                </div>
              </div>
              <Switch
                checked={selectedSet.has(skill.name)}
                onCheckedChange={(checked) =>
                  setSkillEnabled(skill.name, checked)
                }
                aria-label={`${skill.name} skill for this agent`}
              />
            </div>
          ))}
        </Flex>
      )}
    </Card>
  );
}
