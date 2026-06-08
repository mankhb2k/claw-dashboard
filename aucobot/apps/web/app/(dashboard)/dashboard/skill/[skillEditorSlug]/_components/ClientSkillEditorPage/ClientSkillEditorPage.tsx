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
import type { SkillEditorHandle } from "../SkillEditor";
import { SkillEditPanel } from "../SkillEditPanel/SkillEditPanel";
import { SkillAgentPanel } from "../SkillAgentPanel/SkillAgentPanel";
import pageStyles from "../../skillEditorSlug.module.css";
import styles from "./ClientSkillEditorPage.module.css";

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
        setLoadError(err instanceof Error ? err.message : "Không tải skill");
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
      setSaveStatus("saving");
      setSaveError(null);
      try {
        const updated = await projectApi.updateSkill(projectId, current.slug, {
          bodyMarkdown: markdown,
        });
        setSkill(updated);
        setSaveStatus("saved");
        if (updated.lastSyncError && updated.enabled) {
          setSaveError(updated.lastSyncError);
        }
      } catch (err) {
        setSaveStatus("error");
        setSaveError(err instanceof Error ? err.message : "Lưu thất bại");
        toast.error(
          "Lưu skill thất bại",
          err instanceof Error ? err.message : undefined,
        );
      }
    },
    [projectId],
  );

  const handleBodyChange = useCallback((markdown: string) => {
    setBodyMarkdown(markdown);
    setSaveStatus("idle");
  }, []);

  const handleDebouncedSave = useCallback(
    (markdown: string) => {
      void persistBody(markdown);
    },
    [persistBody],
  );

  const handleApplyAiMarkdown = useCallback(async (markdown: string) => {
    await editorRef.current?.applyMarkdown(markdown);
    setBodyMarkdown(markdown);
    toast.success("AI đã cập nhật editor", "Đang lưu vào skill…");
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
      toast.success("Đã sao chép SKILL.md");
    } catch {
      toast.error("Không thể sao chép");
    }
  }, []);

  const handleToggleEnabled = useCallback(() => {
    const current = skillRef.current;
    if (!projectId || !current) return;
    void projectApi
      .setSkillEnabled(projectId, current.slug, !current.enabled)
      .then((updated) => {
        setSkill(updated);
        if (updated.enabled && !updated.lastSyncError) {
          toast.success("Đã bật và sync skill");
        } else if (!updated.enabled) {
          toast.success("Đã tắt skill");
        } else if (updated.lastSyncError) {
          toast.error("Sync thất bại", updated.lastSyncError);
        }
      })
      .catch((err) =>
        toast.error(
          "Không đổi trạng thái",
          err instanceof Error ? err.message : undefined,
        ),
      );
  }, [projectId]);

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
        <Typography variant="p">Đang tải dữ liệu...</Typography>
      </Flex>
    );
  }

  if (!projectId) {
    return (
      <Typography variant="p" className={pageStyles.error}>
        Chưa có dự án. Hãy tạo dự án trước khi chỉnh sửa skill.
      </Typography>
    );
  }

  if (loadError || (!skill && !skillLoading && bootstrapped)) {
    return (
      <Flex direction="column" gap={12} className={pageStyles.state}>
        <BackButton href="/dashboard/skill">Quay lại danh sách</BackButton>
        <Typography variant="p" className={pageStyles.error}>
          {loadError ?? "Không tìm thấy skill."}
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
        <Typography variant="p">Đang tải skill...</Typography>
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
        onToggleEnabled={handleToggleEnabled}
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
