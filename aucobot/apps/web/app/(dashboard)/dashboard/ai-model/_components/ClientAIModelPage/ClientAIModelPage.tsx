"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import styles from "./ClientAIModelPage.module.css";
import { CardProvider } from "../CardProvider/CardProvider";
import { SearchItem, TitleHeader } from "@/components/dashboard";
import { Grid } from "@/components/layout/";
import { Typography, Spinner } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";
import { useProjectStore } from "@/stores/project.store";
import { mergeProviderCatalog, type MergedProviderCard } from "@/utils/ai-model/merge-provider-catalog";

import type {
  ProjectEnvMaskedRow,
  ProviderDefinition,
} from "@/schemas/project.schema";

function filterProviderCards(
  cards: MergedProviderCard[],
  query: string,
): MergedProviderCard[] {
  const q = query.trim().toLowerCase();
  if (!q) return cards;
  return cards.filter((provider) => {
    const hay = `${provider.name} ${provider.id} ${provider.status}`.toLowerCase();
    return hay.includes(q);
  });
}

function ProviderGrid({ cards }: { cards: MergedProviderCard[] }) {
  return (
    <Grid columns={4} gap="1rem">
      {cards.map((provider) => (
        <Link
          key={provider.id}
          href={`/dashboard/ai-model/${provider.id}`}
          className={styles.providerLink}
        >
          <CardProvider
            title={provider.name}
            status={provider.status}
            ready={provider.ready}
            iconLabel={provider.icon}
            iconSrc={provider.iconSrc}
          />
        </Link>
      ))}
    </Grid>
  );
}

export function ClientAIModelPage() {
  const { t } = useI18n();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const [definitions, setDefinitions] = useState<ProviderDefinition[]>([]);
  const [envRows, setEnvRows] = useState<ProjectEnvMaskedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [trackedProjectId, setTrackedProjectId] = useState(projectId);
  const [loading, setLoading] = useState(Boolean(projectId));

  if (projectId !== trackedProjectId) {
    setTrackedProjectId(projectId);
    setLoading(Boolean(projectId));
    setError(null);
  }

  useEffect(() => {
    void fetchProjects({ silent: true });
  }, [fetchProjects]);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      setError(null);

      try {
        const [defs, rows] = await Promise.all([
          projectApi.listProviderDefinitions(),
          projectId ? projectApi.listProviderKeys(projectId) : Promise.resolve([]),
        ]);
        setDefinitions(defs);
        setEnvRows(rows);
      } catch (err) {
        setDefinitions([]);
        setEnvRows([]);
        setError(err instanceof Error ? err.message : t("aiModel.errors.loadProviders"));
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, t]);

  const catalog = useMemo(
    () => mergeProviderCatalog(definitions, envRows),
    [definitions, envRows],
  );

  const filteredCatalog = useMemo(
    () => ({
      foundation: filterProviderCards(catalog.foundation, search),
      aiProvider: filterProviderCards(catalog.aiProvider, search),
    }),
    [catalog, search],
  );

  const hasAnyResults =
    filteredCatalog.foundation.length > 0 ||
    filteredCatalog.aiProvider.length > 0;

  return (
    <div className={styles.container}>
      <TitleHeader
        titleKey="aiModel.page.title"
        descriptionKey="aiModel.page.description"
        showBorder
      />
      {error && (
        <Typography variant="p" className={styles.error}>
          {error}
        </Typography>
      )}

      {!loading && (
        <SearchItem
          id="ai-model-search"
          placeholder={t("aiModel.page.searchPlaceholder")}
          value={search}
          onChange={setSearch}
          maxWidth={360}
          pageSpacing
        />
      )}

      {loading ? (
        <div className={styles.loading}>
          <Spinner size="md" />
        </div>
      ) : !hasAnyResults ? (
        <Typography variant="p" color="muted" className={styles.empty}>
          {search.trim()
            ? t("aiModel.page.noMatch")
            : t("aiModel.page.empty")}
        </Typography>
      ) : (
        <>
          {filteredCatalog.foundation.length > 0 && (
            <section className={styles.section}>
              <Typography variant="h3" weight="medium" className={styles.title}>
                Foundation Model
              </Typography>
              <ProviderGrid cards={filteredCatalog.foundation} />
            </section>
          )}

          {filteredCatalog.aiProvider.length > 0 && (
            <section className={styles.section}>
              <Typography variant="h3" weight="medium" className={styles.title}>
                AI Provider
              </Typography>
              <ProviderGrid cards={filteredCatalog.aiProvider} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
