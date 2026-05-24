"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Typography, Spinner, toast } from "@/components/ui";
import { Container, Flex } from "@/components/layout";
import { buildSkillMarkdown } from "@/lib/skill-markdown";
import { projectApi } from "@/lib/api/project";
import type { ProjectSkillDetail } from "@/schemas/project.schema";
import { useProjectStore } from "@/stores/project.store";
import { SkillEditor, type SkillEditorHandle } from "./_components/SkillEditor";
import { SkillAssistantPanel } from "./_components/SkillAssistantPanel/SkillAssistantPanel";
import styles from "./skillEditorSlug.module.css";

export default function ProjectSkillEditorPage() {
  const params = useParams();
  const skillSlug =
    typeof params.skillEditorSlug === "string" ? params.skillEditorSlug : "";

  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const projectsLoading = useProjectStore((s) => s.isLoading);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const [bootstrapped, setBootstrapped] = useState(false);
  const [skillLoading, setSkillLoading] = useState(false);
  const [skill, setSkill] = useState<ProjectSkillDetail | null>(null);
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
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

  const persistBody = useCallback(async (markdown: string) => {
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
      toast.error("Lưu skill thất bại", err instanceof Error ? err.message : undefined);
    }
  }, [projectId]);

  const handleBodyChange = useCallback(
    (markdown: string) => {
      setBodyMarkdown(markdown);
      setSaveStatus("idle");
    },
    [],
  );

  const handleDebouncedSave = useCallback(
    (markdown: string) => {
      void persistBody(markdown);
    },
    [persistBody],
  );

  const builderPreview = useMemo(() => {
    if (!skill) return null;
    return buildSkillMarkdown(
      {
        name: skill.name,
        description: skill.description,
        heading: skill.heading ?? undefined,
      },
      bodyMarkdown,
    );
  }, [skill, bodyMarkdown]);

  const handleApplyAiMarkdown = useCallback(
    async (markdown: string) => {
      await editorRef.current?.applyMarkdown(markdown);
      setBodyMarkdown(markdown);
      toast.success("AI đã cập nhật editor", "Đang lưu vào skill…");
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    if (!builderPreview?.trim()) return;
    try {
      await navigator.clipboard.writeText(builderPreview);
      toast.success("Đã sao chép SKILL.md");
    } catch {
      toast.error("Không thể sao chép");
    }
  }, [builderPreview]);

  if (!bootstrapped || (projectsLoading && !projectId)) {
    return (
      <Flex direction="column" align="stretch" className={styles.page}>
        <Container size="md" display="flex" className={styles.shell}>
          <Flex direction="column" align="center" justify="center" gap={2} className={styles.state}>
            <Spinner size="md" />
            <Typography variant="p">Đang tải dữ liệu...</Typography>
          </Flex>
        </Container>
      </Flex>
    );
  }

  if (!projectId) {
    return (
      <Flex direction="column" align="stretch" className={styles.page}>
        <Container size="md" display="flex" className={styles.shell}>
          <Typography variant="p" className={styles.error}>
            Chưa có dự án. Hãy tạo dự án trước khi chỉnh sửa skill.
          </Typography>
        </Container>
      </Flex>
    );
  }

  if (loadError || (!skill && !skillLoading && bootstrapped)) {
    return (
      <Flex direction="column" align="stretch" className={styles.page}>
        <Container size="md" display="flex" className={styles.shell}>
          <Link href="/dashboard/skill" className={styles.back}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              arrow_back
            </span>
            Quay lại danh sách
          </Link>
          <Typography variant="p" className={styles.error}>
            {loadError ?? "Không tìm thấy skill."}
          </Typography>
        </Container>
      </Flex>
    );
  }

  if (!skill || skillLoading) {
    return (
      <Flex direction="column" align="stretch" className={styles.page}>
        <Container size="md" display="flex" className={styles.shell}>
          <Flex direction="column" align="center" justify="center" gap={2} className={styles.state}>
            <Spinner size="md" />
            <Typography variant="p">Đang tải skill...</Typography>
          </Flex>
        </Container>
      </Flex>
    );
  }

  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="lg" display="flex" className={styles.shell}>
        <Flex justify="between" align="center" className={styles.topBar}>
          <Link href="/dashboard/skill" className={styles.back}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              arrow_back
            </span>
            Quay lại danh sách
          </Link>
          <Flex align="center" gap={12}>
            {saveStatus === "saving" ? (
              <Typography variant="small" color="muted">
                Đang lưu...
              </Typography>
            ) : null}
            {saveStatus === "saved" ? (
              <Typography variant="small" color="muted">
                Đã lưu
                {skill.enabled ? " · đã sync OpenClaw" : ""}
              </Typography>
            ) : null}
            {saveStatus === "error" && saveError ? (
              <Typography variant="small" className={styles.error}>
                {saveError}
              </Typography>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                void projectApi
                  .setSkillEnabled(projectId, skill.slug, !skill.enabled)
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
                  )
              }
            >
              {skill.enabled ? "Tắt skill" : "Bật & sync"}
            </Button>
          </Flex>
        </Flex>

        <div className={styles.editorLayout}>
          <SkillEditor
            ref={editorRef}
            initialBodyMarkdown={skill.bodyMarkdown}
            onChange={handleBodyChange}
            onDebouncedSave={handleDebouncedSave}
            onCopy={() => void handleCopy()}
          />
          <aside className={styles.assistantAside}>
            <SkillAssistantPanel
              projectId={projectId}
              skill={skill}
              currentBodyMarkdown={bodyMarkdown}
              onApplyMarkdown={(md) => void handleApplyAiMarkdown(md)}
            />
          </aside>
        </div>
      </Container>
    </Flex>
  );
}
