"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useProjectStore } from "@/stores/project.store";
import { projectApi } from "@/lib/api/project";
import { mergeChannelCatalog, type ChannelCatalogCard } from "@/lib/channels/merge-channel-catalog";
import { CardChannel } from "../CardChannel/CardChannel";
import styles from "./ClientChannelPage.module.css";
import { Flex, Grid } from "@/components/layout";
import { Button, Spinner, Typography } from "@/components/ui";
import { SearchItem } from "@/components/dashboard";

interface ClientChannelPageProps {
  projectId: string;
}

export default function ClientChannelPage({ projectId: projectIdProp }: ClientChannelPageProps) {
  const projects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const projectId = projectIdProp || projects[0]?.id || "";
  const project = projects.find((p) => p.id === projectId);

  const [projectsFetched, setProjectsFetched] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<ChannelCatalogCard[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setProjectsFetched(false);
    void fetchProjects().finally(() => setProjectsFetched(true));
  }, [fetchProjects]);

  const loadChannels = useCallback(async () => {
    if (!projectId) return;
    setChannelsLoading(true);
    setChannelsError(null);
    try {
      const [definitions, rows] = await Promise.all([
        projectApi.listChannelDefinitions(),
        projectApi.listChannels(projectId),
      ]);
      setCatalog(mergeChannelCatalog(definitions, rows));
    } catch (err) {
      setChannelsError(err instanceof Error ? err.message : "Không tải được danh sách kênh");
      setCatalog([]);
    } finally {
      setChannelsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((ch) => {
      const hay = `${ch.name} ${ch.channelId} ${ch.description}`.toLowerCase();
      return hay.includes(q);
    });
  }, [catalog, search]);

  const loading = !projectsFetched || (Boolean(projectId) && channelsLoading);

  if (!projectId && !projectsFetched) {
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
      <p className={styles.error}>
        Chưa có project. Tạo project tại mục Tổng quan trước khi cấu hình kênh.
      </p>
    );
  }

  if (!project && !projectsFetched) {
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

  if (projectsFetched && !project) {
    return (
      <div style={{ paddingTop: "var(--space-4)" }}>
        <Link className={styles.back} href="/dashboard">
          Về tổng quan
        </Link>
        <p className={styles.error}>Không tìm thấy dự án.</p>
      </div>
    );
  }

  return (
    <>
      <SearchItem
        id="channel-search"
        placeholder="Tìm kiếm kênh..."
        value={search}
        onChange={setSearch}
        maxWidth={360}
        className={styles.searchBar}
      />

      {channelsError ? (
        <Flex direction="column" align="center" gap={3} className={styles.errorBlock}>
          <p className={styles.error}>{channelsError}</p>
          <Button type="button" variant="secondary" onClick={() => void loadChannels()}>
            Thử lại
          </Button>
        </Flex>
      ) : null}

      <div className={styles.gridScroll}>
        {loading ? (
          <Flex direction="column" align="center" justify="center" gap={3} className={styles.loadingContainer}>
            <Spinner size="md" />
            <Typography variant="p" color="muted">
              Đang tải kênh...
            </Typography>
          </Flex>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>
            {catalog.length === 0
              ? "Chưa có kênh nào khả dụng trên server."
              : "Không tìm thấy kênh nào phù hợp."}
          </p>
        ) : (
          <Grid columns={4} gap="1rem">
            {filtered.map((ch) => {
              const card = (
                <CardChannel
                  title={ch.name}
                  status={ch.statusLabel}
                  iconSrc={ch.iconSrc}
                  iconLabel={ch.iconLabel}
                />
              );

              if (!ch.isActive) {
                return (
                  <div
                    key={ch.channelId}
                    className={styles.channelCardDisabled}
                    aria-disabled
                    title="Kênh sắp được hỗ trợ"
                  >
                    {card}
                  </div>
                );
              }

              return (
                <Link
                  key={ch.channelId}
                  href={`/dashboard/channel/${ch.channelId}`}
                  className={styles.channelLink}
                >
                  {card}
                </Link>
              );
            })}
          </Grid>
        )}
      </div>
    </>
  );
}
