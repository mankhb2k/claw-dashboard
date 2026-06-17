"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useFormContext } from "react-hook-form";
import { Flex } from "@/components/layout";
import { Typography, Switch, Card, Button } from "@/components/ui";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useProjectStore } from "@/stores/project.store";
import { useProjectSkills } from "@/hooks/skill/use-project-skills";
import type { AgentFormInput } from "@/schemas/agent-form.schema";
import styles from "./AgentSkillAllowlistCard.module.css";

export function AgentSkillAllowlistCard() {
  const { t } = useI18n();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const { watch, setValue } = useFormContext<AgentFormInput>();
  const skillNames = watch("skillNames");

  const { skills, loading, error: loadError } = useProjectSkills(projectId);

  const enabledSkills = useMemo(
    () => skills.filter((skill) => skill.enabled),
    [skills],
  );

  const selectedSet = useMemo(() => new Set(skillNames), [skillNames]);

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
              {t("agent.skills.title")}
            </Typography>
            <Typography variant="small" color="muted">
              {t("agent.skills.description")}
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
                {t("agent.skills.disableAll")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnableAll}
                disabled={skillNames.length === enabledSkills.length}
              >
                {t("agent.skills.enableAll")}
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
          {t("agent.skills.loading")}
        </Typography>
      ) : enabledSkills.length === 0 ? (
        <div className={styles.emptyState}>
          <Typography variant="small" color="muted">
            {t("agent.skills.empty")}{" "}
            <Link href="/dashboard/skill" className={styles.emptyLink}>
              {t("agent.skills.createLink")}
            </Link>{" "}
            {t("agent.skills.createSuffix")}
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
                aria-label={t("agent.skills.toggleAria", { name: skill.name })}
              />
            </div>
          ))}
        </Flex>
      )}
    </Card>
  );
}
