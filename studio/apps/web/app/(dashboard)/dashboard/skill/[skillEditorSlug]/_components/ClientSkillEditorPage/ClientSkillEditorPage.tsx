"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./ClientSkillEditorPage.module.css";
import pageStyles from "../../skillEditorSlug.module.css";
import { SkillAgentPanel } from "../SkillAgentPanel/SkillAgentPanel";
import { SkillEditPanel } from "../SkillEditPanel/SkillEditPanel";
import { BackButton } from "@/components/dashboard";
import { Flex } from "@/components/layout";
import { Typography, Spinner, toast } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";
import { useProjectStore } from "@/stores/project.store";
import { useSkillEditorStore } from "@/stores/skill/skill-editor.store";
import { buildSkillMarkdown } from "@/utils/skill/skill-markdown";

import type { SkillEditorHandle } from "../SkillEditPanel/SkillEditPanel";
import type { ProjectSkillDetail } from "@/schemas/project.schema";

const MIN_SAVING_DISPLAY_MS = 2000;
const SAVED_DISPLAY_MS = 3000;

export function ClientSkillEditorPage() {
  const { t } = useI18n();
  const params = useParams();
  const skillSlug =
    typeof params.skillEditorSlug === "string" ? params.skillEditorSlug : "";

  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const projectsLoading = useProjectStore((s) => s.isLoading);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const skillPanelOpen = useSkillEditorStore((s) => s.skillPanelOpen);
  const toggleSkillPanel = useSkillEditorStore((s) => s.toggleSkillPanel);
  const setSkillSnapshot = useSkillEditorStore((s) => s.setSkillSnapshot);

  const [bootstrapped, setBootstrapped] = useState(false);
  const [skill, setSkill] = useState<ProjectSkillDetail | null>(null);
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const loadKey = projectId && skillSlug ? `${projectId}:${skillSlug}` : "";
  const [trackedLoadKey, setTrackedLoadKey] = useState(loadKey);
  const [skillLoading, setSkillLoading] = useState(Boolean(loadKey));

  if (loadKey !== trackedLoadKey) {
    setTrackedLoadKey(loadKey);
    setSkillLoading(Boolean(loadKey));
    setLoadError(null);
  }

  const bodyRef = useRef(bodyMarkdown);
  const skillRef = useRef(skill);
  useEffect(() => {
    bodyRef.current = bodyMarkdown;
    skillRef.current = skill;
  }, [bodyMarkdown, skill]);
  const editorRef = useRef<SkillEditorHandle>(null);
  const saveStartedAtRef = useRef<number | null>(null);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSeqRef = useRef(0);

  const clearSaveStatusTimer = useCallback(() => {
    if (saveStatusTimerRef.current) {
      clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = null;
    }
  }, []);

  const scheduleSaveStatus = useCallback(
    (seq: number, next: "saved" | "error", onShow?: () => void) => {
      const startedAt = saveStartedAtRef.current ?? Date.now();
      const delay = Math.max(
        0,
        MIN_SAVING_DISPLAY_MS - (Date.now() - startedAt),
      );

      clearSaveStatusTimer();
      saveStatusTimerRef.current = setTimeout(() => {
        saveStatusTimerRef.current = null;
        if (seq !== saveSeqRef.current) return;
        onShow?.();
        setSaveStatus(next);

        if (next === "saved") {
          saveStatusTimerRef.current = setTimeout(() => {
            saveStatusTimerRef.current = null;
            if (seq !== saveSeqRef.current) return;
            setSaveStatus("idle");
          }, SAVED_DISPLAY_MS);
        }
      }, delay);
    },
    [clearSaveStatusTimer],
  );

  useEffect(() => {
    return () => clearSaveStatusTimer();
  }, [clearSaveStatusTimer]);

  useEffect(() => {
    void fetchProjects({ silent: true }).finally(() => setBootstrapped(true));
  }, [fetchProjects]);

  useEffect(() => {
    if (!projectId || !skillSlug) return;
    void (async () => {
      await Promise.resolve();
      try {
        const row = await projectApi.getSkill(projectId, skillSlug);
        setSkill(row);
        setBodyMarkdown(row.bodyMarkdown);
      } catch (err) {
        setSkill(null);
        setLoadError(err instanceof Error ? err.message : t("skills.errors.load"));
      } finally {
        setSkillLoading(false);
      }
    })();
    // Omit `t`: only used for fallback error messages; locale change must not reload skill body.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- §9.11
  }, [projectId, skillSlug]);

  useEffect(() => {
    if (!skill) {
      setSkillSnapshot(null);
      return;
    }
    setSkillSnapshot({
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      heading: skill.heading,
      bodyMarkdown,
    });
  }, [skill, bodyMarkdown, setSkillSnapshot]);

  const persistBody = useCallback(
    async (markdown: string) => {
      const current = skillRef.current;
      if (!projectId || !current) return;

      const seq = ++saveSeqRef.current;
      saveStartedAtRef.current = Date.now();
      clearSaveStatusTimer();
      setSaveStatus("saving");
      setSaveError(null);

      try {
        const updated = await projectApi.updateSkill(projectId, current.slug, {
          bodyMarkdown: markdown,
        });
        if (seq !== saveSeqRef.current) return;

        setSkill(updated);
        scheduleSaveStatus(seq, "saved", () => {
          if (updated.lastSyncError && updated.enabled) {
            setSaveError(updated.lastSyncError);
          }
        });
      } catch (err) {
        if (seq !== saveSeqRef.current) return;

        const message = err instanceof Error ? err.message : t("skills.errors.save");
        scheduleSaveStatus(seq, "error", () => {
          setSaveError(message);
          toast.error(t("skills.toasts.saveFailed"), message);
        });
      }
    },
    [clearSaveStatusTimer, projectId, scheduleSaveStatus, t],
  );

  const handleBodyChange = useCallback(
    (markdown: string) => {
      setBodyMarkdown(markdown);
      clearSaveStatusTimer();
      setSaveStatus("idle");
    },
    [clearSaveStatusTimer],
  );

  const handleDebouncedSave = useCallback(
    (markdown: string) => {
      void persistBody(markdown);
    },
    [persistBody],
  );

  const handleApplyAiMarkdown = useCallback(async (markdown: string) => {
    await editorRef.current?.applyMarkdown(markdown);
    setBodyMarkdown(markdown);
    toast.success(t("skills.toasts.aiUpdated"), t("skills.toasts.aiUpdatedDescription"));
  }, [t]);

  const handleCopy = useCallback(async () => {
    const current = skillRef.current;
    if (!current) return;
    const preview = buildSkillMarkdown(
      {
        name: current.name,
        description: current.description,
        heading: current.heading ?? undefined,
      },
      bodyRef.current,
    );
    if (!preview.trim()) return;
    try {
      await navigator.clipboard.writeText(preview);
      toast.success(t("skills.toasts.copied"));
    } catch {
      toast.error(t("skills.toasts.copyFailed"));
    }
  }, [t]);

  if (!bootstrapped || (projectsLoading && !projectId)) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap={2}
        className={pageStyles.state}
      >
        <Spinner size="md" />
        <Typography variant="p">{t("skills.page.loadingData")}</Typography>
      </Flex>
    );
  }

  if (!projectId) {
    return (
      <Typography variant="p" className={pageStyles.error}>
        {t("skills.page.noProjectEdit")}
      </Typography>
    );
  }

  if (loadError || (!skill && !skillLoading && bootstrapped)) {
    return (
      <Flex direction="column" gap={12} className={pageStyles.state}>
        <BackButton href="/dashboard/skill">{t("skills.page.backToList")}</BackButton>
        <Typography variant="p" className={pageStyles.error}>
          {loadError ?? t("skills.page.skillNotFound")}
        </Typography>
      </Flex>
    );
  }

  if (!skill || skillLoading) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap={2}
        className={pageStyles.state}
      >
        <Spinner size="md" />
        <Typography variant="p">Loading skill...</Typography>
      </Flex>
    );
  }

  return (
    <div className={styles.root}>
      <SkillEditPanel
        skill={skill}
        skillPanelOpen={skillPanelOpen}
        onToggleSkillPanel={toggleSkillPanel}
        saveStatus={saveStatus}
        saveError={saveError}
        editorRef={editorRef}
        initialBodyMarkdown={skill.bodyMarkdown}
        onBodyChange={handleBodyChange}
        onDebouncedSave={handleDebouncedSave}
        onCopy={() => void handleCopy()}
      />
      {skillPanelOpen ? (
        <div className={styles.skillPanelWrap}>
          <SkillAgentPanel onApplyMarkdown={handleApplyAiMarkdown} />
        </div>
      ) : null}
    </div>
  );
}
