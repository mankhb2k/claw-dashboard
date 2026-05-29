"use client";

import { useState } from "react";
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
import { Flex } from "@/components/layout";
import { MoreHorizontal, Eye, EyeOff } from "lucide-react";
import styles from "./CardApiKey.module.css";

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
  onEdit: (conn: Connection) => void;
  onDelete: (id: string) => void;
  onToggleDisabled: (id: string) => void;
}

export function CardApiKey({
  connections,
  isLoaded,
  testingConnId = null,
  onEdit,
  onDelete,
  onToggleDisabled,
}: CardApiKeyProps) {
  const [visibleKeyIds, setVisibleKeyIds] = useState<string[]>([]);

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeyIds((prev) =>
      prev.includes(id) ? prev.filter((keyId) => keyId !== id) : [...prev, id],
    );
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
            const displayedKey = isVisible
              ? conn.key
              : "•••••••••••••••••••••••••••••••••••••••••";
            const isTesting = conn.pending || testingConnId === conn.id;
            return (
              <Card
                key={conn.id}
                className={`${styles.connectionCard} ${conn.disabled || conn.pending ? styles.connectionCardDisabled : ""}`}
                disableHover
              >
                <Flex justify="between" align="center">
                  <Flex align="center" gap={12}>
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
                    <div>
                      <Typography variant="p" weight="medium" as="span">
                        {conn.name}
                      </Typography>
                      <Flex align="center" gap={4}>
                        <Typography
                          variant="p"
                          color="muted"
                          className={styles.maskedKey}
                        >
                          {displayedKey}
                        </Typography>
                        <button
                          className={styles.eyeBtn}
                          onClick={() => toggleKeyVisibility(conn.id)}
                          aria-label={isVisible ? "Ẩn key" : "Hiện key"}
                        >
                          {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </Flex>
                    </div>
                  </Flex>

                  {/* Toggle + Dropdown menu (ellipsis)*/}
                  <Flex align="center" gap={8}>
                    <Switch
                      checked={!conn.disabled && !conn.pending}
                      disabled={isTesting}
                      onCheckedChange={() => onToggleDisabled(conn.id)}
                      aria-label={conn.disabled ? "Bật kết nối" : "Tắt kết nối"}
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
                          {conn.disabled ? "Kết nối" : "Tắt kết nối"}
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
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
