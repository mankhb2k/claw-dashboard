"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Grid } from "@/components/layout/";
import { Typography, Spinner } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type { ProjectEnvMaskedRow } from "@/schemas/project.schema";
import { CardProvider } from "../CardProvider/CardProvider";
import { APIKEY_PROVIDERS } from "@/utils/ai-model/providers-data";
import styles from "./ClientAIModelPage.module.css";

function providerConnectionStatus(
  envKey: string | undefined,
  row: ProjectEnvMaskedRow | undefined,
): { status: string; ready: boolean } {
  if (!envKey || !row) {
    return { status: "No connection", ready: false };
  }
  if (row.enabled === false) {
    return { status: "Disabled", ready: false };
  }
  if (row.lastTestOk === false) {
    return { status: "Connection error", ready: false };
  }
  return { status: "connection", ready: true };
}

export default function ClientAIModelPage() {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const [envRows, setEnvRows] = useState<ProjectEnvMaskedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchProjects({ silent: true });
  }, [fetchProjects]);

  useEffect(() => {
    if (!projectId) {
      setEnvRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void projectApi
      .listProviderKeys(projectId)
      .then(setEnvRows)
      .catch((err) => {
        setEnvRows([]);
        setError(err instanceof Error ? err.message : "Cannot load API keys");
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const envByKey = useMemo(() => {
    const map: Record<string, ProjectEnvMaskedRow> = {};
    for (const row of envRows) {
      map[row.key] = row;
    }
    return map;
  }, [envRows]);

  return (
    <div className={styles.container}>
      <Typography variant="h3" weight="medium" className={styles.title}>
        API Key Providers
      </Typography>

      {error && (
        <Typography variant="p" className={styles.error}>
          {error}
        </Typography>
      )}

      {loading ? (
        <div className={styles.loading}>
          <Spinner size="md" />
        </div>
      ) : (
        <Grid columns={3} gap="1rem">
          {APIKEY_PROVIDERS.map((provider) => {
            const row = provider.envKey ? envByKey[provider.envKey] : undefined;
            const { status, ready } = providerConnectionStatus(
              provider.envKey,
              row,
            );
            return (
              <Link
                key={provider.id}
                href={`/dashboard/ai-model/${provider.id}`}
                className={styles.providerLink}
              >
                <CardProvider
                  title={provider.name}
                  status={status}
                  ready={ready}
                  iconLabel={provider.icon}
                  iconSrc={provider.iconSrc}
                />
              </Link>
            );
          })}
        </Grid>
      )}
    </div>
  );
}
