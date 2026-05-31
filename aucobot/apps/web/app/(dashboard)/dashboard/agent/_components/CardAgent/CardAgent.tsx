import React from "react";
import { Flex } from "@/components/layout";
import {
  Typography,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Card,
  Avatar,
} from "@/components/ui";
import {
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  Sparkles,
} from "lucide-react";
import styles from "./CardAgent.module.css";
import { AgentItem } from "../../agentMockData";

interface CardAgentProps {
  agent: AgentItem;
  onClick: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function CardAgent({
  agent,
  onClick,
  onEdit,
  onDuplicate,
  onDelete,
}: CardAgentProps) {
  // Xác định dòng chip màu của từng dòng mô hình AI
  const getModelClass = (modelName: string) => {
    const name = modelName.toLowerCase();
    if (name.includes("gpt")) return styles.tagOpenAI;
    if (name.includes("claude")) return styles.tagClaude;
    if (name.includes("gemini")) return styles.tagGemini;
    return styles.tagSecondary;
  };

  return (
    <Card
      className={styles.card}
      hover="md"
      onClick={onClick}
    >
      {/* Card Header */}
      <div className={styles.cardHeader}>
        <Flex align="center" gap={12}>
          <Avatar
            size="lg"
            fallback={agent.avatar}
            className={styles.avatar}
          />
          <div className={styles.info}>
            <Flex align="center" gap={8}>
              <Typography variant="h4" as="span">{agent.name}</Typography>
              <div
                className={`${styles.statusIndicator} ${
                  !agent.isActive ? styles.inactive : ""
                }`}
                title={agent.isActive ? "Active" : "Disabled"}
              />
            </Flex>
            <Typography variant="small" color="muted">
              {agent.id}
            </Typography>
          </div>
        </Flex>

        {/* Nút thao tác nhanh */}
        <DropdownMenu>
          <DropdownMenuTrigger variant="kebab" onClick={(e) => e.stopPropagation()}>
            <MoreVertical size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Flex align="center" gap={8}>
                <Edit2 size={14} />
                <span>Edit</span>
              </Flex>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Flex align="center" gap={8}>
                <Copy size={14} />
                <span>Duplicate</span>
              </Flex>
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Flex align="center" gap={8}>
                <Trash2 size={14} />
                <span>Delete</span>
              </Flex>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mô tả nhiệm vụ */}
      <Typography variant="small" color="muted" className={styles.description}>
        {agent.description}
      </Typography>

      {/* Phân loại các thông số đính kèm */}
      <Flex wrap="wrap" gap={8} className={styles.tags}>
        <span className={`${styles.tag} ${getModelClass(agent.model)}`}>
          {agent.model}
        </span>
        <span className={`${styles.tag} ${styles.tagSecondary}`}>
          <Sparkles size={12} />
          {agent.skillsCount} Skills
        </span>
      </Flex>
    </Card>
  );
}
