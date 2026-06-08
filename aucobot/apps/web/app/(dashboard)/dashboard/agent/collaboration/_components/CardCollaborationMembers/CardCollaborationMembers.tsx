"use client";

import React from "react";
import { Flex } from "@/components/layout";
import {
  Typography,
  Checkbox,
  Avatar,
  Card,
  Button,
} from "@/components/ui";
import { SearchItem } from "@/components/dashboard";
import type { ProjectAgentListRow } from "@/schemas/project.schema";
import styles from "./CardCollaborationMembers.module.css";

type CardCollaborationMembersProps = {
  enabled: boolean;
  agents: ProjectAgentListRow[];
  filteredAgents: ProjectAgentListRow[];
  memberSlugs: string[];
  searchQuery: string;
  validationError: string | null;
  saveError: string | null;
  onSearchChange: (value: string) => void;
  onMemberToggle: (slug: string, checked: boolean) => void;
  onSelectAllEnabled: () => void;
};

export function CardCollaborationMembers({
  enabled,
  agents,
  filteredAgents,
  memberSlugs,
  searchQuery,
  validationError,
  saveError,
  onSearchChange,
  onMemberToggle,
  onSelectAllEnabled,
}: CardCollaborationMembersProps) {
  const listDisabled = !enabled;

  return (
    <Card className={styles.card} disableHover>
      <Flex justify="between" align="center" gap={3} className={styles.toolbar}>
        <SearchItem
          id="collaboration-agent-search"
          placeholder="Search agents..."
          value={searchQuery}
          onChange={onSearchChange}
          className={styles.search}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={listDisabled || agents.every((a) => !a.enabled)}
          onClick={onSelectAllEnabled}
        >
          Select all enabled
        </Button>
      </Flex>

      <div
        className={`${styles.listPanel} ${listDisabled ? styles.listPanelDisabled : ""}`}
      >
        <Typography variant="small" weight="medium" className={styles.listTitle}>
          Members
          {enabled && memberSlugs.length > 0 ? ` (${memberSlugs.length})` : ""}
        </Typography>

        {agents.length === 0 ? (
          <Typography variant="small" color="muted" className={styles.listState}>
            No agents in this project yet. Create agents first.
          </Typography>
        ) : filteredAgents.length === 0 ? (
          <Typography variant="small" color="muted" className={styles.listState}>
            No matching agents found.
          </Typography>
        ) : (
          <ul className={styles.list}>
            {filteredAgents.map((agent) => {
              const checked = memberSlugs.includes(agent.slug);
              const checkboxId = `collaboration-member-${agent.slug}`;

              return (
                <li key={agent.slug} className={styles.listItem}>
                  <Flex align="center" gap={3} className={styles.agentInfo}>
                    <Avatar src="" fallback={agent.avatar} size="sm" />
                    <div className={styles.agentMeta}>
                      <Typography variant="p" weight="medium">
                        {agent.name}
                      </Typography>
                      <Typography variant="small" color="muted">
                        {agent.slug}
                      </Typography>
                    </div>
                  </Flex>
                  <Checkbox
                    id={checkboxId}
                    size="sm"
                    checked={checked}
                    disabled={listDisabled || !agent.enabled}
                    onCheckedChange={(val) =>
                      onMemberToggle(agent.slug, val === true)
                    }
                    aria-label={`Include ${agent.name} in collaboration`}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!enabled ? (
        <Typography variant="small" color="muted">
          Turn on collaboration to select members.
        </Typography>
      ) : null}

      {validationError ? (
        <Typography variant="small" className={styles.fieldError}>
          {validationError}
        </Typography>
      ) : null}

      {saveError ? (
        <Typography variant="small" className={styles.fieldError}>
          {saveError}
        </Typography>
      ) : null}
    </Card>
  );
}
