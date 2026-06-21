"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import styles from "./ClientChannelPage.module.css";
import { CardChannel } from "../CardChannel/CardChannel";
import { BackButton, SearchItem, TitleHeader } from "@/components/dashboard";
import { Flex, Grid } from "@/components/layout";
import { Button, Spinner, Typography } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";
import { useProjectStore } from "@/stores/project.store";
import { mergeChannelCatalog, type ChannelCatalogCard } from "@/utils/channels/merge-channel-catalog";

interface ClientChannelPageProps {
  projectId: string;
}

export function ClientChannelPage({ projectId: projectIdProp }: ClientChannelPageProps) {
  const { t } = useI18n();
  const projects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const projectId = projectIdProp || projects[0]?.id || "";
  const project = projects.find((p) => p.id === projectId);

  const [projectsFetched, setProjectsFetched] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<ChannelCatalogCard[]>([]);
  const [search, setSearch] = useState("");
  const [trackedProjectId, setTrackedProjectId] = useState(projectId);

  if (projectId !== trackedProjectId) {
    setTrackedProjectId(projectId);
    setChannelsLoading(Boolean(projectId));
    setChannelsError(null);
  }

  useEffect(() => {
    void fetchProjects().finally(() => setProjectsFetched(true));
  }, [fetchProjects]);

  const loadChannels = useCallback(async () => {
    if (!projectId) return;
    await Promise.resolve();
    setChannelsLoading(true);
    setChannelsError(null);
    try {
      const [definitions, rows] = await Promise.all([
        projectApi.listChannelDefinitions(),
        projectApi.listChannels(projectId),
      ]);
      setCatalog(mergeChannelCatalog(definitions, rows));
    } catch (err) {
      setChannelsError(err instanceof Error ? err.message : t("channels.page.loadError"));
      setCatalog([]);
    } finally {
      setChannelsLoading(false);
    }
  }, [projectId, t]);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await loadChannels();
    })();
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

  const pageHeader = (
    <TitleHeader
      titleKey="channels.page.title"
      descriptionKey="channels.page.description"
      showBorder
    />
  );

  if (!projectId && !projectsFetched) {
    return (
      <>
        {pageHeader}
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={3}
          className={styles.loadingContainer}
        >
          <Spinner size="md" />
          <Typography variant="p" color="muted">
            {t("channels.page.loading")}
          </Typography>
        </Flex>
      </>
    );
  }

  if (!projectId) {
    return (
      <>
        {pageHeader}
        <p className={styles.error}>{t("channels.page.noProject")}</p>
      </>
    );
  }

  if (!project && !projectsFetched) {
    return (
      <>
        {pageHeader}
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={3}
          className={styles.loadingContainer}
        >
          <Spinner size="md" />
          <Typography variant="p" color="muted">
            {t("channels.page.loading")}
          </Typography>
        </Flex>
      </>
    );
  }

  if (projectsFetched && !project) {
    return (
      <>
        {pageHeader}
        <div className={styles.errorWrap}>
          <BackButton href="/dashboard">{t("channels.page.backToOverview")}</BackButton>
          <p className={styles.error}>{t("channels.page.projectNotFound")}</p>
        </div>
      </>
    );
  }

  return (
    <>
      {pageHeader}
      <SearchItem
        id="channel-search"
        placeholder={t("channels.page.searchPlaceholder")}
        value={search}
        onChange={setSearch}
        maxWidth={360}
        pageSpacing
      />

      {channelsError ? (
        <Flex direction="column" align="center" gap={3} className={styles.errorBlock}>
          <p className={styles.error}>{channelsError}</p>
          <Button type="button" variant="secondary" onClick={() => void loadChannels()}>
            {t("channels.page.retry")}
          </Button>
        </Flex>
      ) : null}

      <div className={styles.gridScroll}>
        {loading ? (
          <Flex direction="column" align="center" justify="center" gap={3} className={styles.loadingContainer}>
            <Spinner size="md" />
            <Typography variant="p" color="muted">
              {t("channels.page.loadingChannels")}
            </Typography>
          </Flex>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>
            {catalog.length === 0
              ? t("channels.page.emptyServer")
              : t("channels.page.emptySearch")}
          </p>
        ) : (
          <Grid columns={4} gap={16}>
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
                    title={t("channels.page.comingSoon")}
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
