"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Grid } from "@/components/layout/";
import { Typography, Spinner } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type {
  ProjectEnvMaskedRow,
  ProviderDefinition,
} from "@/schemas/project.schema";
import { mergeProviderCatalog, type MergedProviderCard } from "@/utils/ai-model/merge-provider-catalog";
import { CardProvider } from "../CardProvider/CardProvider";
import { I18nTitleHeader, SearchItem } from "@/components/dashboard";
import styles from "./ClientAIModelPage.module.css";

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

export default function ClientAIModelPage() {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const [definitions, setDefinitions] = useState<ProviderDefinition[]>([]);
  const [envRows, setEnvRows] = useState<ProjectEnvMaskedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void fetchProjects({ silent: true });
  }, [fetchProjects]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    void Promise.all([
      projectApi.listProviderDefinitions(),
      projectId ? projectApi.listProviderKeys(projectId) : Promise.resolve([]),
    ])
      .then(([defs, rows]) => {
        setDefinitions(defs);
        setEnvRows(rows);
      })
      .catch((err) => {
        setDefinitions([]);
        setEnvRows([]);
        setError(err instanceof Error ? err.message : "Cannot load providers");
      })
      .finally(() => setLoading(false));
  }, [projectId]);

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
      <I18nTitleHeader
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
          placeholder="Search providers..."
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
            ? "No matching providers found."
            : "No providers available."}
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
