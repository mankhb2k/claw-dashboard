"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Spinner,
  Typography,
} from "@/components/ui";
import { Grid } from "@/components/layout";
import { projectApi } from "@/lib/api/project";
import type { SkillStoreItem } from "@/schemas/project.schema";
import styles from "./ModalSkillStore.module.css";

interface ModalSkillStoreProps {
  projectId: string;
  isOpen: boolean;
  installingSlug: string | null;
  onClose: () => void;
  onInstall: (slug: string, openAfterInstall?: boolean) => void;
  onOpenSkill: (slug: string) => void;
}

export function ModalSkillStore({
  projectId,
  isOpen,
  installingSlug,
  onClose,
  onInstall,
  onOpenSkill,
}: ModalSkillStoreProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SkillStoreItem[]>([]);

  useEffect(() => {
    if (!isOpen || !projectId) return;
    let active = true;
    setIsLoading(true);
    setError(null);
    void projectApi
      .searchSkillStore(projectId, query)
      .then((rows) => {
        if (!active) return;
        setItems(rows);
      })
      .catch((err) => {
        if (!active) return;
        setItems([]);
        setError(err instanceof Error ? err.message : "Cannot load skill store.");
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId, isOpen, query]);

  const hasResult = useMemo(() => items.length > 0, [items.length]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={styles.content}>
        <DialogHeader className={styles.header}>
          <DialogTitle>Browser Store</DialogTitle>
        </DialogHeader>

        <div className={styles.searchWrap}>
          <Input
            id="skill-store-search"
            className={styles.search}
            placeholder="e.g. google, notes, bug..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {isLoading ? (
            <div className={styles.centered}>
              <Spinner size="sm" />
              <Typography variant="small" color="muted">
                Loading skills...
              </Typography>
            </div>
          ) : null}

          {error ? (
            <Typography variant="small" className={styles.errorText}>
              {error}
            </Typography>
          ) : null}

          {!isLoading && !error && !hasResult ? (
            <Typography variant="small" color="muted">
              No matching skills.
            </Typography>
          ) : null}

          {!isLoading && !error && hasResult ? (
            <Grid columns={2} gap="var(--space-3)" className={styles.list}>
                {items.map((item) => {
                  const busy = installingSlug === item.slug;
                  return (
                    <div
                      key={item.slug}
                      className={styles.card}
                    >
                      <div className={styles.cardMain}>
                        <Typography variant="p" weight="bold">
                          {item.heading}
                        </Typography>
                        <Typography variant="small" color="muted">
                          {item.description}
                        </Typography>
                        <div className={styles.tagRow}>
                          {item.tags.map((tag) => (
                            <span key={tag} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      {item.installed ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onOpenSkill(item.slug)}
                        >
                          Open editor
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => onInstall(item.slug, true)}
                        >
                          {busy ? "Installing..." : "Install & Open"}
                        </Button>
                      )}
                    </div>
                  );
                })}
            </Grid>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
