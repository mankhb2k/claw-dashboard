"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit2, Download, Trash2, MoreVertical, Code } from "lucide-react";
import {
  Card,
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
  onEdit?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

export function CardSkill({
  title,
  description,
  href,
  onEdit,
  onDownload,
  onDelete,
}: CardSkillProps) {
  const router = useRouter();

  return (
    <Card className={styles.card} hover="md">
      <div className={styles.cardHeader}>
        <Link href={href} className={styles.headText}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <p className={styles.desc}>{description}</p>
        </Link>
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
    </Card>
  );
}
