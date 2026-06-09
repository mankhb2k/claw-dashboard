"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Flex } from "@/components/layout";
import { Typography, Spinner, toast } from "@/components/ui";
import { BackButton } from "@/components/dashboard";
import { buildSkillMarkdown } from "@/lib/skill-markdown";
import { projectApi } from "@/lib/api/project";
import type { ProjectSkillDetail } from "@/schemas/project.schema";
import { useProjectStore } from "@/stores/project.store";
import { useSkillEditorUiStore } from "@/stores/skill-editor-ui.store";
import type { SkillEditorHandle } from "../SkillEditPanel/SkillEditPanel";
import { SkillEditPanel } from "../SkillEditPanel/SkillEditPanel";
import { SkillAgentPanel } from "../SkillAgentPanel/SkillAgentPanel";
import pageStyles from "../../skillEditorSlug.module.css";
import styles from "./ClientSkillEditorPage.module.css";

const MIN_SAVING_DISPLAY_MS = 2000;
const SAVED_DISPLAY_MS = 3000;

export function ClientSkillEditorPage() {
  const params = useParams();
  const skillSlug =
    typeof params.skillEditorSlug === "string" ? params.skillEditorSlug : "";

  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const projectsLoading = useProjectStore((s) => s.isLoading);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const skillPanelOpen = useSkillEditorUiStore((s) => s.skillPanelOpen);
  const toggleSkillPanel = useSkillEditorUiStore((s) => s.toggleSkillPanel);
  const setSkillSnapshot = useSkillEditorUiStore((s) => s.setSkillSnapshot);

  const [bootstrapped, setBootstrapped] = useState(false);
  const [skillLoading, setSkillLoading] = useState(false);
  const [skill, setSkill] = useState<ProjectSkillDetail | null>(null);
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const bodyRef = useRef(bodyMarkdown);
  bodyRef.current = bodyMarkdown;
  const skillRef = useRef(skill);
  skillRef.current = skill;
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
    setLoadError(null);
    setSkillLoading(true);
    void projectApi
      .getSkill(projectId, skillSlug)
      .then((row) => {
        setSkill(row);
        setBodyMarkdown(row.bodyMarkdown);
      })
      .catch((err) => {
        setSkill(null);
        setLoadError(err instanceof Error ? err.message : "Failed to load skill");
      })
      .finally(() => setSkillLoading(false));
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

        const message = err instanceof Error ? err.message : "Save failed";
        scheduleSaveStatus(seq, "error", () => {
          setSaveError(message);
          toast.error("Failed to save skill", message);
        });
      }
    },
    [clearSaveStatusTimer, projectId, scheduleSaveStatus],
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
    toast.success("AI updated the editor", "Saving to skill…");
  }, []);

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
      toast.success("Copied SKILL.md");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, []);

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
        <Typography variant="p">Loading data...</Typography>
      </Flex>
    );
  }

  if (!projectId) {
    return (
      <Typography variant="p" className={pageStyles.error}>
        No project yet. Create a project before editing a skill.
      </Typography>
    );
  }

  if (loadError || (!skill && !skillLoading && bootstrapped)) {
    return (
      <Flex direction="column" gap={12} className={pageStyles.state}>
        <BackButton href="/dashboard/skill">Back to list</BackButton>
        <Typography variant="p" className={pageStyles.error}>
          {loadError ?? "Skill not found."}
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
