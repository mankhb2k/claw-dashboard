"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import { Plus, Store } from "lucide-react";
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
  toast,
} from "@/components/ui";
import {
  buildSkillMetaJson,
  buildSkillMarkdown,
  type SkillDraft,
} from "@/utils/skill/skill-markdown";
import { projectApi } from "@/lib/api/project";
import type { ProjectSkillListRow } from "@/schemas/project.schema";
import { useProjectSkills } from "@/hooks/skill/use-project-skills";
import { useProjectStore } from "@/stores/project.store";
import { SearchItem, I18nTitleHeader } from "@/components/dashboard";
import { CardSkill } from "../CardSkill/CardSkill";
import { ModalCreateSkill } from "../ModalCreateSkill/ModalCreateSkill";
import { ModalSkillStore } from "../ModalSkillStore/ModalSkillStore";
import { Flex, Grid } from "@/components/layout";
import styles from "./ClientSkillPage.module.css";

export function ClientSkillPage() {
  const router = useRouter();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const projectsLoading = useProjectStore((s) => s.isLoading);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const {
    skills,
    loading: skillsLoading,
    error: loadError,
    refresh: loadSkills,
    create: createSkill,
    update: updateSkill,
    setEnabled: setSkillEnabledApi,
    remove: removeSkill,
    syncAll,
    setSkills,
  } = useProjectSkills(projectId, { enabled: Boolean(projectId) });
  const [searchQuery, setSearchQuery] = useState("");
  const [syncingAll, setSyncingAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [installingStoreSlug, setInstallingStoreSlug] = useState<string | null>(null);

  useEffect(() => {
    void fetchProjects({ silent: true });
  }, [fetchProjects]);

  const loading = projectsLoading || skillsLoading;

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
          await updateSkill(editingSlug, {
            name: data.name,
            description: data.description,
            heading: data.heading || null,
          });
          toast.success("Skill updated");
        } else {
          const created = await createSkill({
            slug: data.name,
            name: data.name,
            description: data.description,
            heading: data.heading,
            bodyMarkdown: "",
            enabled: false,
          });
          toast.success("Skill created");
          setIsModalOpen(false);
          router.push(`/dashboard/skill/${created.slug}`);
          return;
        }
        setIsModalOpen(false);
      } catch (err) {
        toast.error(
          "Failed to save skill",
          err instanceof Error ? err.message : undefined,
        );
      }
    },
    [editingSlug, createSkill, updateSkill, router],
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
          "ZIP download failed",
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
        prev.map((s) =>
          s.slug === skill.slug ? { ...s, enabled: nextEnabled } : s,
        ),
      );
      try {
        const result = await setSkillEnabledApi(skill.slug, nextEnabled);
        setSkills((prev) =>
          prev.map((s) => (s.slug === skill.slug ? result : s)),
        );
        if (result.lastSyncError && nextEnabled) {
          toast.error("Skill sync failed", result.lastSyncError);
        } else if (nextEnabled) {
          toast.success(
            "Enabled skill",
            "Agent will apply at the next chat message (/new if old session).",
          );
        }
      } catch (err) {
        setSkills((prev) =>
          prev.map((s) =>
            s.slug === skill.slug ? { ...s, enabled: !nextEnabled } : s,
          ),
        );
        toast.error(
          "Cannot change skill status",
          err instanceof Error ? err.message : undefined,
        );
      } finally {
        setTogglingSlug(null);
      }
    },
    [setSkillEnabledApi, setSkills],
  );

  const confirmDeleteSkill = useCallback(async () => {
    if (!skillToDelete || !projectId) return;
    try {
      await removeSkill(skillToDelete);
      toast.success("Deleted skill successfully");
      setSkillToDelete(null);
    } catch (err) {
      toast.error(
        "Delete skill failed",
        err instanceof Error ? err.message : undefined,
      );
    }
  }, [skillToDelete, projectId, removeSkill]);

  const handleSyncAll = useCallback(async () => {
    if (!projectId) return;
    setSyncingAll(true);
    try {
      const result = await syncAll();
      toast.success(
        "Skills re-synced",
        `${result.synced} synced${result.failed ? `, ${result.failed} failed` : ""}`,
      );
    } catch (err) {
      toast.error(
        "Re-sync failed",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setSyncingAll(false);
    }
  }, [projectId, syncAll]);

  const handleInstallFromStore = useCallback(
    async (slug: string, openAfterInstall = false) => {
      if (!projectId) return;
      setInstallingStoreSlug(slug);
      try {
        const created = await projectApi.installSkillFromStore(projectId, { slug });
        toast.success("Installed skill", `${created.heading ?? created.name} is ready to edit.`);
        await loadSkills();
        setIsStoreModalOpen(false);
        if (openAfterInstall) {
          router.push(`/dashboard/skill/${created.slug}`);
        }
      } catch (err) {
        toast.error(
          "Install failed",
          err instanceof Error ? err.message : "Cannot install from Browser Store.",
        );
      } finally {
        setInstallingStoreSlug(null);
      }
    },
    [projectId, loadSkills, router],
  );

  const filteredSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter(
      (skill) =>
        skill.name.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q) ||
        skill.slug.toLowerCase().includes(q) ||
        (skill.heading?.toLowerCase().includes(q) ?? false),
    );
  }, [skills, searchQuery]);

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
      <>
        <I18nTitleHeader
          titleKey="skills.page.title"
          descriptionKey="skills.page.description"
          showBorder
        />
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={3}
          className={styles.loadingContainer}
        >
          <Spinner size="md" />
          <Typography variant="p" color="muted">
            Loading data...
          </Typography>
        </Flex>
      </>
    );
  }

  if (!projectId) {
    return (
      <>
        <I18nTitleHeader
          titleKey="skills.page.title"
          descriptionKey="skills.page.description"
          showBorder
        />
        <Typography variant="p" className={styles.errorText}>
          No project. Please create a project before managing skills.
        </Typography>
      </>
    );
  }

  return (
    <>
      <I18nTitleHeader
        titleKey="skills.page.title"
        descriptionKey="skills.page.description"
        showBorder
      />
      <Flex
        justify="between"
        align="center"
        wrap="wrap"
        className={styles.toolbar}
      >
        <Flex align="center" gap={3} className={styles.toolbarStart}>
          <SearchItem
            id="skill-search"
            placeholder="Search skill..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </Flex>
        <div className={styles.toolbarActions}>
          <Button
            variant="ghost"
            onClick={() => void handleSyncAll()}
            disabled={syncingAll}
          >
            {syncingAll ? "Re-syncing…" : "Re-sync skills"}
          </Button>
          <Button variant="secondary" onClick={() => setIsStoreModalOpen(true)}>
            <Store size={16} aria-hidden />
            Browser Store
          </Button>
          <Button onClick={openCreateModal}>
            <Plus size={16} aria-hidden />
            Create new skill
          </Button>
        </div>
      </Flex>

      <div className={styles.scrollArea}>
        {loadError ? (
          <Typography variant="p" className={styles.errorText}>
            {loadError}
          </Typography>
        ) : null}
        <Grid columns={4} gap="var(--space-4)" fullWidth className={styles.skillGrid}>
          {filteredSkills.map((skill) => (
            <CardSkill
              key={skill.slug}
              title={skill.name}
              description={skill.description}
              href={`/dashboard/skill/${skill.slug}`}
              enabled={skill.enabled}
              hasSyncError={Boolean(skill.lastSyncError)}
              isBusy={togglingSlug === skill.slug}
              onToggleEnabled={(checked) =>
                void handleToggleEnabled(skill, checked)
              }
              onEdit={() => openEditModal(skill)}
              onDownload={() => void handleDownloadZip(skill)}
              onDelete={() => setSkillToDelete(skill.slug)}
            />
          ))}

          {skills.length === 0 ? (
            <Typography variant="p" color="muted" className={styles.emptyText}>
              No skills yet. Please create the first skill!
            </Typography>
          ) : filteredSkills.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              gap={3}
              className={styles.emptyText}
            >
              <Typography variant="p" color="muted">
                No matching skills. Try a different search query.
              </Typography>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            </Flex>
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

      <ModalSkillStore
        projectId={projectId}
        isOpen={isStoreModalOpen}
        installingSlug={installingStoreSlug}
        onClose={() => setIsStoreModalOpen(false)}
        onInstall={(slug, openAfterInstall) =>
          void handleInstallFromStore(slug, openAfterInstall)
        }
        onOpenSkill={(slug) => router.push(`/dashboard/skill/${slug}`)}
      />

      <AlertDialog
        open={!!skillToDelete}
        onOpenChange={(open) => !open && setSkillToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this skill? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSkillToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={() => void confirmDeleteSkill()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
