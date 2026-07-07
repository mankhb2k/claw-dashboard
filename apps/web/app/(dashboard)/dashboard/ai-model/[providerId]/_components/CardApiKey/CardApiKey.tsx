"use client";

import { MoreHorizontal, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import styles from "./CardApiKey.module.css";
import {
  Card,
  Typography,
  Switch,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui";

const HIDDEN_KEY_PLACEHOLDER = "·····························";

interface Connection {
  id: string;
  name: string;
  key: string;
  disabled?: boolean;
  pending?: boolean;
}

interface CardApiKeyProps {
  connections: Connection[];
  isLoaded: boolean;
  testingConnId?: string | null;
  onRevealKey?: (connId: string) => Promise<string>;
  onEdit: (conn: Connection) => void;
  onDelete: (id: string) => void;
  onToggleDisabled: (id: string) => void;
}

export function CardApiKey({
  connections,
  isLoaded,
  testingConnId = null,
  onRevealKey,
  onEdit,
  onDelete,
  onToggleDisabled,
}: CardApiKeyProps) {
  const [visibleKeyIds, setVisibleKeyIds] = useState<string[]>([]);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);

  const toggleKeyVisibility = (conn: Connection) => {
    const { id } = conn;
    if (visibleKeyIds.includes(id)) {
      setVisibleKeyIds((prev) => prev.filter((keyId) => keyId !== id));
      return;
    }

    if (revealedKeys[id]) {
      setVisibleKeyIds((prev) => [...prev, id]);
      return;
    }

    if (!onRevealKey) {
      setVisibleKeyIds((prev) => [...prev, id]);
      return;
    }

    setRevealingId(id);
    void onRevealKey(id)
      .then((apiKey) => {
        setRevealedKeys((prev) => ({ ...prev, [id]: apiKey }));
        setVisibleKeyIds((prev) => [...prev, id]);
      })
      .finally(() => {
        setRevealingId((current) => (current === id ? null : current));
      });
  };

  return (
    <div className={styles.connectionsWrapper}>
      {!isLoaded ? (
        <Typography variant="p" color="muted" as="span">
          Loading...
        </Typography>
      ) : (
        <div className={styles.connectionsGrid}>
          {connections.map((conn) => {
            const isVisible = visibleKeyIds.includes(conn.id);
            const isRevealing = revealingId === conn.id;
            const isTesting = conn.pending || testingConnId === conn.id;
            return (
              <Card
                key={conn.id}
                className={`${styles.connectionCard} ${conn.disabled || conn.pending ? styles.connectionCardDisabled : ""}`}
                disableHover
              >
                <div className={styles.cardRow}>
                  <div
                    className={
                      conn.disabled
                        ? styles.iconWrapper
                        : styles.iconWrapperSuccess
                    }
                  >
                    <span
                      className={`material-symbols-outlined ${conn.disabled ? styles.iconLock : styles.iconKey}`}
                    >
                      {conn.disabled ? "link_off" : "key"}
                    </span>
                  </div>

                  <div className={styles.colKey}>
                    <Typography variant="p" weight="medium" as="span">
                      {conn.name}
                    </Typography>
                    <div className={styles.keyRow}>
                      <Typography
                        variant="p"
                        color="muted"
                        className={`${styles.maskedKey} ${!isVisible && !isRevealing ? styles.hiddenKeyPlaceholder : styles.revealedKey}`}
                        title={
                          isVisible && !isRevealing
                            ? (revealedKeys[conn.id] ?? conn.key)
                            : undefined
                        }
                      >
                        {isRevealing
                          ? "Loading key..."
                          : isVisible
                            ? (revealedKeys[conn.id] ?? conn.key)
                            : HIDDEN_KEY_PLACEHOLDER}
                      </Typography>
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => toggleKeyVisibility(conn)}
                        disabled={isRevealing}
                        aria-label={isVisible ? "Hide key" : "Show key"}
                      >
                        {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.colActions}>
                    <Switch
                      checked={!conn.disabled && !conn.pending}
                      disabled={isTesting}
                      onCheckedChange={() => onToggleDisabled(conn.id)}
                      aria-label={
                        conn.disabled
                          ? "Enable connection"
                          : "Disable connection"
                      }
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger variant="kebab">
                        <MoreHorizontal size={16} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onEdit(conn)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => onToggleDisabled(conn.id)}
                        >
                          {conn.disabled
                            ? "Enable connection"
                            : "Disable connection"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="danger"
                          onSelect={() => onDelete(conn.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
