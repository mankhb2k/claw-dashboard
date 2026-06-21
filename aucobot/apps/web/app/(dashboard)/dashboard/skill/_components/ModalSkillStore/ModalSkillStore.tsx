"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import styles from "./ModalSkillStore.module.css";
import {
  CardSkillStore,
  CardSkillStoreSkeleton,
} from "../CardSkillStore/CardSkillStore";
import { Box, Flex, Grid } from "@/components/layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  Spinner,
  Typography,
} from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";

import type { SkillStoreItem } from "@/schemas/project.schema";

const STORE_PAGE_SIZE = 50;

const STORE_SKELETON_KEYS = ["sk-0", "sk-1", "sk-2", "sk-3"] as const;

const STORE_SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "downloads", label: "Most downloaded" },
  { value: "stars", label: "Most starred" },
  { value: "newest", label: "Newest" },
] as const;

const SORT_SELECT_OPTIONS = STORE_SORT_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

type StoreSort = (typeof STORE_SORT_OPTIONS)[number]["value"];

const SCROLL_LOAD_ROOT_MARGIN = "0px";

interface ModalSkillStoreProps {
  projectId: string;
  isOpen: boolean;
  installingSlug: string | null;
  onClose: () => void;
  onInstall: (slug: string, openAfterInstall?: boolean) => void;
  onOpenSkill: (slug: string) => void;
}

function mergeStoreItems(prev: SkillStoreItem[], next: SkillStoreItem[]): SkillStoreItem[] {
  if (next.length === 0) return prev;
  const seen = new Set(prev.map((row) => row.slug));
  const appended = next.filter((row) => !seen.has(row.slug));
  return appended.length === 0 ? prev : [...prev, ...appended];
}

function afterPaint(callback: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback);
  });
}

export function ModalSkillStore({
  projectId,
  isOpen,
  installingSlug,
  onClose,
  onInstall,
  onOpenSkill,
}: ModalSkillStoreProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<StoreSort>("recommended");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SkillStoreItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const requestGen = useRef(0);
  const appendLockRef = useRef(false);
  const listSectionRef = useRef<HTMLDivElement>(null);
  const loadSentinelRef = useRef<HTMLDivElement>(null);
  const nextCursorRef = useRef<string | null>(null);

  const trimmedQuery = query.trim();
  const isSearchMode = trimmedQuery.length > 0;
  const fetchKey =
    isOpen && projectId ? `${projectId}:${trimmedQuery}:${sort}` : "";
  const [trackedFetchKey, setTrackedFetchKey] = useState(fetchKey);

  if (fetchKey !== trackedFetchKey) {
    setTrackedFetchKey(fetchKey);
    setNextCursor(null);
    setContentReady(false);
  }

  if ((isLoading || isLoadingMore) && contentReady) {
    setContentReady(false);
  }

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  const fetchPage = useCallback(
    async (opts: { cursor?: string; append?: boolean }) => {
      const gen = ++requestGen.current;
      if (opts.append) {
        if (appendLockRef.current) return;
        appendLockRef.current = true;
        setContentReady(false);
        setIsLoadingMore(true);
      } else {
        setContentReady(false);
        setIsLoading(true);
        setError(null);
      }

      try {
        const page = await projectApi.searchSkillStore(projectId, {
          q: isSearchMode ? trimmedQuery : undefined,
          cursor: opts.cursor,
          limit: STORE_PAGE_SIZE,
          sort: isSearchMode ? undefined : sort,
        });
        if (gen !== requestGen.current) return;

        setItems((prev) =>
          opts.append ? mergeStoreItems(prev, page.items) : page.items,
        );
        setNextCursor(page.nextCursor);
      } catch (err) {
        if (gen !== requestGen.current) return;
        if (!opts.append) {
          setItems([]);
          setNextCursor(null);
        }
        setError(err instanceof Error ? err.message : t("skills.errors.loadStore"));
        if (opts.append) {
          setContentReady(true);
        }
      } finally {
        if (gen !== requestGen.current) return;
        if (opts.append) {
          appendLockRef.current = false;
        }
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [projectId, isSearchMode, trimmedQuery, sort, t],
  );

  useEffect(() => {
    if (!isOpen || !projectId) return undefined;
    void (async () => {
      await Promise.resolve();
      await fetchPage({ append: false });
    })();
    appendLockRef.current = false;
    return () => {
      requestGen.current += 1;
      appendLockRef.current = false;
    };
  }, [projectId, isOpen, trimmedQuery, sort, fetchPage]);

  const hasResult = useMemo(() => items.length > 0, [items.length]);

  if (!isLoading && !isLoadingMore && !hasResult && !contentReady) {
    setContentReady(true);
  }

  const canObserveScroll = useMemo(
    () =>
      isOpen &&
      !isSearchMode &&
      Boolean(nextCursor) &&
      !isLoading &&
      !isLoadingMore &&
      contentReady &&
      hasResult,
    [isOpen, isSearchMode, nextCursor, isLoading, isLoadingMore, contentReady, hasResult],
  );

  const lastItemSpansFull =
    !isSearchMode &&
    !nextCursor &&
    !isLoadingMore &&
    items.length % 2 === 1 &&
    items.length > 0;

  useLayoutEffect(() => {
    if (isLoading || isLoadingMore || !hasResult) return undefined;
    let cancelled = false;
    afterPaint(() => {
      if (!cancelled) setContentReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [items, isLoading, isLoadingMore, hasResult]);

  useEffect(() => {
    if (!canObserveScroll) return undefined;
    const root = listSectionRef.current;
    const target = loadSentinelRef.current;
    if (!root || !target) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        const cursor = nextCursorRef.current;
        if (!hit || !cursor || isSearchMode || appendLockRef.current) return;
        void fetchPage({ cursor, append: true });
      },
      {
        root,
        rootMargin: SCROLL_LOAD_ROOT_MARGIN,
        threshold: 0,
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [canObserveScroll, isSearchMode, fetchPage]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={styles.content}>
        <DialogHeader className={styles.header}>
          <DialogTitle>Browser Store</DialogTitle>
          <DialogDescription>
            Browse and install community skills from ClawHub.
          </DialogDescription>
        </DialogHeader>

        <Flex direction="column" className={styles.body}>
          <Flex
            direction="column"
            gap="var(--space-3)"
            fullWidth
            className={styles.searchSection}
          >
            <Input
              id="skill-store-search"
              className={styles.search}
              placeholder="e.g. google, notes, bug..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {!isSearchMode ? (
              <Flex justify="end" fullWidth className={styles.sortRow}>
                <Box className={styles.sortField}>
                  <Select
                    id="skill-store-sort"
                    label="Sort"
                    value={sort}
                    onValueChange={(value) => setSort(value as StoreSort)}
                    options={SORT_SELECT_OPTIONS}
                  />
                </Box>
              </Flex>
            ) : null}
          </Flex>

          <Box ref={listSectionRef} className={styles.listSection}>
            {isLoading ? (
              <Grid columns={2} gap="var(--space-4)" fullWidth className={styles.listGrid}>
                {STORE_SKELETON_KEYS.map((key) => (
                  <CardSkillStoreSkeleton key={key} pulse />
                ))}
              </Grid>
            ) : null}

            {error ? (
              <Typography variant="small" className={styles.errorText}>
                {error}
              </Typography>
            ) : null}

            {!isLoading && !error && !hasResult ? (
              <Typography
                variant="small"
                color="muted"
                className={styles.statusBlock}
              >
                No matching skills.
              </Typography>
            ) : null}

            {!isLoading && !error && hasResult ? (
              <>
                <Grid columns={2} gap="var(--space-4)" fullWidth className={styles.listGrid}>
                  {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    return (
                      <CardSkillStore
                        key={item.slug}
                        item={item}
                        installingSlug={installingSlug}
                        onInstall={onInstall}
                        onOpenSkill={onOpenSkill}
                        spanFull={isLast && lastItemSpansFull}
                      />
                    );
                  })}
                </Grid>

                {isLoadingMore ? (
                  <Flex
                    align="center"
                    justify="center"
                    gap={8}
                    className={styles.loadMoreStatus}
                  >
                    <Spinner size="sm" />
                    <Typography variant="small" color="muted">
                      Loading more...
                    </Typography>
                  </Flex>
                ) : null}

                {canObserveScroll ? (
                  <div ref={loadSentinelRef} className={styles.scrollSentinel} aria-hidden />
                ) : null}

                {!isSearchMode && hasResult && !nextCursor && contentReady && !isLoadingMore ? (
                  <Typography
                    variant="small"
                    color="muted"
                    className={styles.endHint}
                  >
                    End of catalog ({items.length} skills).
                  </Typography>
                ) : null}
              </>
            ) : null}
          </Box>
        </Flex>
      </DialogContent>
    </Dialog>
  );
}
