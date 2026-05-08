"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/stores/project.store";
import { useCreateProjectModalStore } from "@/stores/create-project-modal.store";
import { Header } from "@/components/dashboard/Header/Header";
import { ProjectCard } from "@/components/dashboard/ProjectCard/ProjectCard";
import { Button, Typography } from "@/components/ui";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const projects = useProjectStore((s) => s.projects);
  const isLoading = useProjectStore((s) => s.isLoading);
  const error = useProjectStore((s) => s.error);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const openCreateModal = useCreateProjectModalStore((s) => s.open);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <>
      <Header title="Dashboard" />

      <div className={styles.page}>
        <div className={styles.topbar}>
          <div>
            <Typography as="h2" variant="h3" className={styles.heading}>
              Projects của bạn
            </Typography>
            <Typography as="p" variant="p" className={styles.sub}>
              Mỗi project chạy trên 1 container riêng biệt
            </Typography>
          </div>
          <Button type="button" onClick={() => openCreateModal("dashboard")}>
            + Tạo project
          </Button>
        </div>

        {error && (
          <Typography as="p" className={styles.error}>
            {error}
          </Typography>
        )}

        {isLoading ? (
          <div className={styles.empty}>
            <span className={styles.spinner} />
            <Typography as="p">Đang tải...</Typography>
          </div>
        ) : projects.length === 0 ? (
          <div className={styles.empty}>
            <Typography as="p" className={styles.emptyIcon}>
              ◈
            </Typography>
            <Typography as="p" className={styles.emptyText}>
              Chưa có project nào
            </Typography>
            <Button type="button" onClick={() => openCreateModal("dashboard")}>
              Tạo project đầu tiên
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
