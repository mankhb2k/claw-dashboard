"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit2, Download, Trash2, MoreVertical, Code } from "lucide-react";
import {
  Card,
  Switch,
  Typography,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui";
import styles from "./CardSkill.module.css";

interface CardSkillProps {
  title: string;
  description: string;
  href: string;
  enabled: boolean;
  hasSyncError: boolean;
  isBusy?: boolean;
  onEdit?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onToggleEnabled?: (next: boolean) => void;
}

export function CardSkill({
  title,
  description,
  href,
  enabled,
  hasSyncError,
  isBusy = false,
  onEdit,
  onDownload,
  onDelete,
  onToggleEnabled,
}: CardSkillProps) {
  const router = useRouter();
  const statusLabel = hasSyncError
    ? "Sync error"
    : enabled
      ? "Active"
      : "Disabled";
  const statusClass = hasSyncError
    ? styles.statusError
    : enabled
      ? styles.statusActive
      : styles.statusDisabled;

  return (
    <Card className={styles.card} hover="md">
      <div className={styles.cardHeader}>
        <div className={styles.headText}>
          <Link href={href} className={styles.titleLink}>
            <h3 className={styles.cardTitle}>{title}</h3>
          </Link>
          <p className={styles.desc}>{description}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger variant="kebab" onClick={(e) => e.stopPropagation()}>
            <MoreVertical size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 size={14} style={{ marginRight: "8px" }} /> Edit Info
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push(href)}>
              <Code size={14} style={{ marginRight: "8px" }} /> Edit Skill
            </DropdownMenuItem>
            {onDownload && (
              <DropdownMenuItem onClick={onDownload}>
                <Download size={14} style={{ marginRight: "8px" }} /> Download
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem variant="danger" onClick={onDelete}>
                <Trash2 size={14} style={{ marginRight: "8px" }} /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className={styles.cardFooter}>
        <span className={`${styles.statusBadge} ${statusClass}`}>{statusLabel}</span>
        <div className={styles.toggleWrap}>
          <Typography variant="small" color="muted">
            {enabled ? "On" : "Off"}
          </Typography>
          <Switch
            checked={enabled}
            disabled={isBusy}
            onCheckedChange={(checked) => onToggleEnabled?.(checked)}
            aria-label={enabled ? "Disable skill" : "Enable skill"}
          />
        </div>
      </div>
    </Card>
  );
}
