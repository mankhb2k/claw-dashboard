"use client";

import styles from "./CardCollaborationMembers.module.css";
import { SearchItem } from "@/components/dashboard";
import { Flex } from "@/components/layout";
import {
  Typography,
  Checkbox,
  Avatar,
  Card,
  Button,
} from "@/components/ui";
import { useI18n } from "@/lib/i18n";

import type { ProjectAgentListRow } from "@/schemas/project.schema";

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
  const { t } = useI18n();
  const listDisabled = !enabled;

  return (
    <Card className={styles.card} disableHover>
      <Flex justify="between" align="center" gap={3} className={styles.toolbar}>
        <SearchItem
          id="collaboration-agent-search"
          placeholder={t("agent.collaboration.members.searchPlaceholder")}
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
          {t("agent.collaboration.members.selectAll")}
        </Button>
      </Flex>

      <div
        className={`${styles.listPanel} ${listDisabled ? styles.listPanelDisabled : ""}`}
      >
        <Typography variant="small" weight="medium" className={styles.listTitle}>
          {t("agent.collaboration.members.title")}
          {enabled && memberSlugs.length > 0 ? ` (${memberSlugs.length})` : ""}
        </Typography>

        {agents.length === 0 ? (
          <Typography variant="small" color="muted" className={styles.listState}>
            {t("agent.collaboration.members.empty")}
          </Typography>
        ) : filteredAgents.length === 0 ? (
          <Typography variant="small" color="muted" className={styles.listState}>
            {t("agent.collaboration.members.noMatch")}
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
                    aria-label={t("agent.collaboration.members.includeAria", {
                      name: agent.name,
                    })}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!enabled ? (
        <Typography variant="small" color="muted">
          {t("agent.collaboration.members.disabledHint")}
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
