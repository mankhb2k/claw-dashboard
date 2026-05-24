"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import { Plus } from "lucide-react";
import {
  Button,
  Typography,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  Spinner,
  Switch,
  toast,
} from "@/components/ui";
import {
  buildSkillMetaJson,
  buildSkillMarkdown,
  type SkillDraft,
} from "@/lib/skill-markdown";
import { projectApi } from "@/lib/api/project";
import type { ProjectSkillDetail, ProjectSkillListRow } from "@/schemas/project.schema";
import { useProjectStore } from "@/stores/project.store";
import { CardSkill } from "../CardSkill/CardSkill";
import { ModalCreateSkill } from "../ModalCreateSkill/ModalCreateSkill";
import { Flex, Grid } from "@/components/layout";
import styles from "./ClientSkillPage.module.css";

export function ClientSkillPage() {
  const router = useRouter();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const projectsLoading = useProjectStore((s) => s.isLoading);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<ProjectSkillListRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);

  const loadSkills = useCallback(async () => {
    if (!projectId) return;
    setLoadError(null);
    try {
      const rows = await projectApi.listSkills(projectId);
      setSkills(rows);
    } catch (err) {
      setSkills([]);
      setLoadError(err instanceof Error ? err.message : "Không tải được skills");
    }
  }, [projectId]);

  useEffect(() => {
    void fetchProjects({ silent: true });
  }, [fetchProjects]);

  useEffect(() => {
    if (!projectId) {
      setSkills([]);
      setLoading(projectsLoading);
      if (!projectsLoading) {
        setLoadError(null);
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    setLoadError(null);
    void loadSkills().finally(() => setLoading(false));
  }, [projectId, projectsLoading, loadSkills]);

  const openCreateModal = useCallback(() => {
    setEditingSlug(null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((skill: ProjectSkillListRow) => {
    setEditingSlug(skill.slug);
    setIsModalOpen(true);
  }, []);

  const handleSave = useCallback(
    async (data: SkillDraft) => {
      if (!projectId) return;
      try {
        if (editingSlug) {
          await projectApi.updateSkill(projectId, editingSlug, {
            name: data.name,
            description: data.description,
            heading: data.heading || null,
          });
          toast.success("Đã cập nhật skill");
        } else {
          const created = await projectApi.createSkill(projectId, {
            slug: data.name,
            name: data.name,
            description: data.description,
            heading: data.heading,
            bodyMarkdown: "",
            enabled: false,
          });
          toast.success("Đã tạo skill");
          setIsModalOpen(false);
          await loadSkills();
          router.push(`/dashboard/skill/${created.slug}`);
          return;
        }
        setIsModalOpen(false);
        await loadSkills();
      } catch (err) {
        toast.error(
          "Lưu skill thất bại",
          err instanceof Error ? err.message : undefined,
        );
      }
    },
    [projectId, editingSlug, loadSkills, router],
  );

  const handleDownloadZip = useCallback(
    async (skill: ProjectSkillListRow) => {
      try {
        const detail = await projectApi.getSkill(projectId, skill.slug);
        const zip = new JSZip();
        zip.file(
          "SKILL.md",
          buildSkillMarkdown(
            {
              name: detail.name,
              description: detail.description,
              heading: detail.heading ?? undefined,
            },
            detail.bodyMarkdown,
          ),
        );
        zip.file(
          "_meta.json",
          buildSkillMetaJson({
            name: detail.name,
            description: detail.description,
            heading: detail.heading ?? undefined,
          }),
        );
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${skill.name}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        toast.error(
          "Tải ZIP thất bại",
          err instanceof Error ? err.message : undefined,
        );
      }
    },
    [projectId],
  );

  const handleToggleEnabled = useCallback(
    async (skill: ProjectSkillListRow, nextEnabled: boolean) => {
      setTogglingSlug(skill.slug);
      setSkills((prev) =>
        prev.map((s) => (s.slug === skill.slug ? { ...s, enabled: nextEnabled } : s)),
      );
      try {
        const result = await projectApi.setSkillEnabled(
          projectId,
          skill.slug,
          nextEnabled,
        );
        setSkills((prev) =>
          prev.map((s) => (s.slug === skill.slug ? result : s)),
        );
        if (result.lastSyncError && nextEnabled) {
          toast.error("Sync skill thất bại", result.lastSyncError);
        } else if (nextEnabled) {
          toast.success(
            "Đã bật skill",
            "Agent áp dụng ở tin nhắn chat tiếp theo (/new nếu session cũ).",
          );
        }
        await loadSkills();
      } catch (err) {
        setSkills((prev) =>
          prev.map((s) =>
            s.slug === skill.slug ? { ...s, enabled: !nextEnabled } : s,
          ),
        );
        toast.error(
          "Không đổi trạng thái skill",
          err instanceof Error ? err.message : undefined,
        );
      } finally {
        setTogglingSlug(null);
      }
    },
    [projectId, loadSkills],
  );

  const confirmDeleteSkill = useCallback(async () => {
    if (!skillToDelete || !projectId) return;
    try {
      await projectApi.deleteSkill(projectId, skillToDelete);
      toast.success("Đã xóa skill");
      setSkillToDelete(null);
      await loadSkills();
    } catch (err) {
      toast.error(
        "Xóa skill thất bại",
        err instanceof Error ? err.message : undefined,
      );
    }
  }, [skillToDelete, projectId, loadSkills]);

  const activeSkillForEdit = useMemo(() => {
    if (!editingSlug) return undefined;
    const skill = skills.find((s) => s.slug === editingSlug);
    if (!skill) return undefined;
    return {
      name: skill.name,
      description: skill.description,
      heading: skill.heading ?? "",
    };
  }, [editingSlug, skills]);

  if (loading) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap={3}
        className={styles.loadingContainer}
      >
        <Spinner size="md" />
        <Typography variant="p" color="muted">
          Đang tải dữ liệu...
        </Typography>
      </Flex>
    );
  }

  if (!projectId) {
    return (
      <Typography variant="p" className={styles.errorText}>
        Chưa có dự án. Hãy tạo dự án trước khi quản lý skills.
      </Typography>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <Button onClick={openCreateModal}>
          <Plus size={16} style={{ marginRight: 8 }} />
          Tạo Skill mới
        </Button>
      </div>

      <div className={styles.scrollArea}>
        {loadError ? (
          <Typography variant="p" className={styles.errorText}>
            {loadError}
          </Typography>
        ) : null}
        <Grid columns={4} gap="1rem">
          {skills.map((skill) => (
            <div key={skill.slug} className={styles.cardWrapper}>
              <CardSkill
                title={skill.name}
                description={skill.description}
                href={`/dashboard/skill/${skill.slug}`}
                onEdit={() => openEditModal(skill)}
                onDownload={() => void handleDownloadZip(skill)}
                onDelete={() => setSkillToDelete(skill.slug)}
              />
              <Flex align="center" justify="between" className={styles.cardFooter}>
                <Typography variant="small" color="muted">
                  {skill.enabled
                    ? skill.lastSyncError
                      ? "Sync lỗi"
                      : "Đã sync"
                    : "Tắt"}
                </Typography>
                <Switch
                  checked={skill.enabled}
                  disabled={togglingSlug === skill.slug}
                  onCheckedChange={(checked) =>
                    void handleToggleEnabled(skill, checked)
                  }
                  aria-label={skill.enabled ? "Tắt skill" : "Bật skill"}
                />
              </Flex>
            </div>
          ))}

          {skills.length === 0 ? (
            <Typography variant="p" color="muted" className={styles.emptyText}>
              Chưa có kỹ năng nào. Hãy tạo kỹ năng đầu tiên!
            </Typography>
          ) : null}
        </Grid>
      </div>

      <ModalCreateSkill
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => void handleSave(data)}
        initialData={activeSkillForEdit}
        editingSlug={editingSlug}
      />

      <AlertDialog
        open={!!skillToDelete}
        onOpenChange={(open) => !open && setSkillToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa skill này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSkillToDelete(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={() => void confirmDeleteSkill()}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
