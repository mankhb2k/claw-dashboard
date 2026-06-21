"use client";

import {
  Ellipsis,
  MessageSquare,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./ChatSidebar.module.css";
import { SearchItem } from "@/components/dashboard";
import { Box, Flex } from "@/components/layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Skeleton,
  Typography,
} from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import {
  isMainSessionKey,
  resolveSessionDisplayName,
} from "@/utils/chat/session/display";
import {
  formatRelativeSessionTime,
  groupSessionsByDate,
} from "@/utils/chat/session/groups";

import type { GatewaySessionRow } from "@/utils/chat/session/types";

type ChatSidebarProps = {
  sessions: GatewaySessionRow[];
  loading: boolean;
  creating: boolean;
  activeSessionKey: string;
  agentId: string;
  collapsed: boolean;
  disabled?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleCollapse: () => void;
  onSelectSession: (key: string) => void;
  onNewSession: () => void;
  onRenameSession: (key: string, label: string) => Promise<void>;
  onDeleteSession: (key: string) => Promise<void>;
};

function scrollRenameInputToEnd(el: HTMLInputElement) {
  const input = el;
  const end = input.value.length;
  if (end === 0) return;

  // Briefly select the last character so browsers scroll overflow text into view.
  if (end > 1) {
    input.setSelectionRange(end - 1, end);
  }
  input.setSelectionRange(end, end);
  input.scrollLeft = input.scrollWidth;

  requestAnimationFrame(() => {
    input.setSelectionRange(end, end);
    input.scrollLeft = input.scrollWidth;
  });
}

function focusRenameInputAtEnd(input: HTMLInputElement | null) {
  if (!input) return;
  input.focus({ preventScroll: true });
  scrollRenameInputToEnd(input);
}

const RENAME_FOCUS_DELAY_MS = 120;

const SESSION_SKELETON_KEYS = [
  'session-sk-1',
  'session-sk-2',
  'session-sk-3',
  'session-sk-4',
  'session-sk-5',
] as const;

function SessionListSkeleton() {
  return (
    <ul className={styles.sessionList} aria-hidden>
      {SESSION_SKELETON_KEYS.map((key) => (
        <li key={key}>
          <Flex justify="between" align="center" gap={8} className={styles.skeletonRow}>
            <Skeleton variant="text" width="72%" height={13} />
            <Skeleton variant="textSm" width={48} height={11} />
          </Flex>
        </li>
      ))}
    </ul>
  );
}

export function ChatSidebar({
  sessions,
  loading,
  creating,
  activeSessionKey,
  agentId,
  collapsed,
  disabled,
  searchQuery,
  onSearchChange,
  onToggleCollapse,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
}: ChatSidebarProps) {
  const { t } = useI18n();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GatewaySessionRow | null>(
    null,
  );
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [menuOpenKey, setMenuOpenKey] = useState<string | null>(null);
  const skipRenameBlurRef = useRef(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingKey) return undefined;

    skipRenameBlurRef.current = true;
    const timer = window.setTimeout(() => {
      focusRenameInputAtEnd(renameInputRef.current);
      skipRenameBlurRef.current = false;
    }, RENAME_FOCUS_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [editingKey]);

  const grouped = groupSessionsByDate(sessions);
  const trimmedSearch = searchQuery.trim();
  const showEmptySearch =
    !loading && trimmedSearch.length > 0 && sessions.length === 0;
  const showEmptyList =
    !loading && trimmedSearch.length === 0 && sessions.length === 0;

  const cancelRename = useCallback(() => {
    if (renameSaving) return;
    skipRenameBlurRef.current = true;
    setEditingKey(null);
    setRenameValue("");
  }, [renameSaving]);

  const openRename = useCallback((row: GatewaySessionRow) => {
    skipRenameBlurRef.current = true;
    setMenuOpenKey(null);
    setEditingKey(row.key);
    setRenameValue(resolveSessionDisplayName(row.key, row));
  }, []);

  const handleRenameSubmit = useCallback(async () => {
    if (!editingKey || renameSaving) return;
    const row = sessions.find((session) => session.key === editingKey);
    const nextLabel = renameValue.trim();
    if (!nextLabel) {
      cancelRename();
      return;
    }
    const currentLabel = row ? resolveSessionDisplayName(row.key, row) : "";
    if (nextLabel === currentLabel) {
      cancelRename();
      return;
    }
    setRenameSaving(true);
    try {
      await onRenameSession(editingKey, nextLabel);
      skipRenameBlurRef.current = true;
      setEditingKey(null);
      setRenameValue("");
    } catch {
      // Parent sets chat error and rethrows — absorb unhandled rejection.
    } finally {
      setRenameSaving(false);
    }
  }, [
    cancelRename,
    editingKey,
    renameSaving,
    renameValue,
    onRenameSession,
    sessions,
  ]);

  const handleRenameBlur = useCallback(() => {
    if (skipRenameBlurRef.current) {
      skipRenameBlurRef.current = false;
      return;
    }
    void handleRenameSubmit();
  }, [handleRenameSubmit]);

  const handleRenameKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void handleRenameSubmit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancelRename();
      }
    },
    [cancelRename, handleRenameSubmit],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget || deleteSaving) return;
    setDeleteSaving(true);
    try {
      await onDeleteSession(deleteTarget.key);
      setDeleteTarget(null);
    } catch {
      // Parent sets chat error and rethrows — absorb unhandled rejection.
    } finally {
      setDeleteSaving(false);
    }
  }, [deleteTarget, deleteSaving, onDeleteSession]);

  return (
    <>
      <Box
        as="aside"
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
        aria-label={t("chat.sidebar.ariaSessionList")}
      >
        <Flex
          align="center"
          justify={collapsed ? "center" : "between"}
          className={styles.header}
        >
          {!collapsed && (
            <Typography variant="h4" weight="semibold">
              Live Chat
            </Typography>
          )}
          <Button
            size="sm"
            variant="ghost"
            className={styles.collapseBtn}
            onClick={onToggleCollapse}
            iconOnly
            aria-label={collapsed ? t("chat.sidebar.openSidebar") : t("chat.sidebar.closeSidebar")}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} aria-hidden />
            ) : (
              <PanelLeftClose size={16} aria-hidden />
            )}
          </Button>
        </Flex>

        <Box className={styles.actions}>
          <Button
            size="sm"
            variant={collapsed ? "primary" : "outline"}
            className={styles.newChatBtn}
            onClick={onNewSession}
            disabled={disabled || creating}
            loading={creating}
            iconOnly={collapsed}
            fullWidth={!collapsed}
            aria-label={t("chat.sidebar.newChatAria")}
          >
            {!creating && <MessageSquarePlus size={16} aria-hidden />}
            {!collapsed && t("chat.sidebar.newChat")}
          </Button>
        </Box>

        {!collapsed && (
          <>
            <Box
              className={styles.searchWrap}
              data-disabled={disabled ? "" : undefined}
            >
              <SearchItem
                id="chat-session-search"
                placeholder={t("chat.sidebar.searchPlaceholder")}
                value={searchQuery}
                onChange={onSearchChange}
                maxWidth="100%"
              />
            </Box>

            <Box className={styles.listWrap}>
              {loading && sessions.length === 0 ? (
                <SessionListSkeleton />
              ) : showEmptySearch ? (
                <Flex
                  direction="column"
                  align="center"
                  gap={8}
                  className={styles.emptyState}
                >
                  <MessageSquare
                    size={20}
                    className={styles.emptyIcon}
                    aria-hidden
                  />
                  <Typography variant="xs" color="muted" className={styles.emptyText}>
                    {t("chat.sidebar.emptySearch", { query: trimmedSearch })}
                  </Typography>
                </Flex>
              ) : showEmptyList ? (
                <Flex
                  direction="column"
                  align="center"
                  gap={8}
                  className={styles.emptyState}
                >
                  <MessageSquare
                    size={20}
                    className={styles.emptyIcon}
                    aria-hidden
                  />
                  <Typography variant="xs" color="muted" className={styles.emptyText}>
                    {t("chat.sidebar.emptyList")}
                  </Typography>
                </Flex>
              ) : (
                grouped.map(({ group, sessions: groupSessions }) => (
                  <Box as="section" key={group} className={styles.groupSection}>
                    <Typography
                      variant="xs"
                      weight="semibold"
                      color="muted"
                      className={styles.groupHeading}
                    >
                      {t(`chat.sidebar.groups.${group}`)}
                    </Typography>
                    <ul className={styles.sessionList}>
                      {groupSessions.map((row) => {
                        const active = row.key === activeSessionKey;
                        const editing = editingKey === row.key;
                        const isMain = isMainSessionKey(row.key, agentId);
                        const canDelete = !isMain;
                        const menuOpen = menuOpenKey === row.key;
                        const displayName = resolveSessionDisplayName(
                          row.key,
                          row,
                        );

                        return (
                          <li key={row.key}>
                            <Flex
                              align="center"
                              gap={4}
                              className={`${styles.sessionRow} ${active ? styles.sessionRowActive : ""} ${editing ? styles.sessionRowEditing : ""} ${menuOpen ? styles.sessionRowMenuOpen : ""}`}
                            >
                              {editing ? (
                                <Input
                                  ref={renameInputRef}
                                  size="sm"
                                  labelPosition="none"
                                  className={styles.sessionRenameInput}
                                  value={renameValue}
                                  onChange={(event) =>
                                    setRenameValue(event.target.value)
                                  }
                                  onKeyDown={handleRenameKeyDown}
                                  onBlur={handleRenameBlur}
                                  disabled={disabled || renameSaving}
                                  onFocus={(event) =>
                                    focusRenameInputAtEnd(event.currentTarget)
                                  }
                                  aria-label={t("chat.sidebar.renameAria", { name: displayName })}
                                />
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className={styles.sessionMain}
                                    onClick={() => onSelectSession(row.key)}
                                    disabled={disabled || active}
                                    title={row.key}
                                  >
                                    {displayName}
                                  </button>

                                  <Box className={styles.sessionTrailing}>
                                    <Typography
                                      as="span"
                                      variant="xs"
                                      className={styles.sessionTime}
                                      aria-hidden={menuOpen}
                                    >
                                      {formatRelativeSessionTime(row.updatedAt)}
                                    </Typography>

                                    <DropdownMenu
                                      open={menuOpen}
                                      onOpenChange={(open) => {
                                        setMenuOpenKey(open ? row.key : null);
                                        if (!open) {
                                          requestAnimationFrame(() => {
                                            (document.activeElement as HTMLElement | null)?.blur?.();
                                          });
                                        }
                                      }}
                                    >
                                      <DropdownMenuTrigger
                                        variant="kebab"
                                        className={styles.sessionMenuBtn}
                                        aria-label={t("chat.sidebar.optionsAria", { name: displayName })}
                                        disabled={disabled}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Ellipsis size={20} aria-hidden />
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" width={168}>
                                        <DropdownMenuItem
                                          onSelect={() => openRename(row)}
                                        >
                                          <Pencil size={14} aria-hidden />
                                          {t("chat.sidebar.rename")}
                                        </DropdownMenuItem>
                                        {canDelete && (
                                          <DropdownMenuItem
                                            variant="danger"
                                            onSelect={() => {
                                              setDeleteTarget(row);
                                              setMenuOpenKey(null);
                                            }}
                                          >
                                            <Trash2 size={14} aria-hidden />
                                            {t("chat.sidebar.delete")}
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </Box>
                                </>
                              )}
                            </Flex>
                          </li>
                        );
                      })}
                    </ul>
                  </Box>
                ))
              )}
            </Box>
          </>
        )}
      </Box>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && !deleteSaving && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chat.sidebar.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("chat.sidebar.deleteDescription", {
                name: deleteTarget
                  ? resolveSessionDisplayName(deleteTarget.key, deleteTarget)
                  : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSaving}>
              {t("chat.sidebar.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              disabled={deleteSaving}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteConfirm();
              }}
            >
              {deleteSaving ? t("chat.sidebar.deleting") : t("chat.sidebar.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
