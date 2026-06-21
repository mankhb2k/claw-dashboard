"use client";

import styles from "./CardSchedulesFilters.module.css";
import { SearchItem } from "@/components/dashboard";
import { Card, Select } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

type AgentFilterOption = {
  value: string;
  label: string;
};

type CardSchedulesFiltersProps = {
  search: string;
  agentFilter: string;
  agentFilterOptions: AgentFilterOption[];
  onSearchChange: (value: string) => void;
  onAgentFilterChange: (value: string) => void;
};

export function CardSchedulesFilters({
  search,
  agentFilter,
  agentFilterOptions,
  onSearchChange,
  onAgentFilterChange,
}: CardSchedulesFiltersProps) {
  const { t } = useI18n();

  return (
    <Card className={styles.card} disableHover>
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <SearchItem
            id="project-schedule-search"
            value={search}
            onChange={onSearchChange}
            placeholder={t("agent.schedules.filters.searchPlaceholder")}
            maxWidth="100%"
          />
        </div>
        <div className={styles.agentFilter}>
          <Select
            id="project-schedule-agent-filter"
            label={t("agent.schedules.filters.agentLabel")}
            options={agentFilterOptions}
            value={agentFilter}
            onValueChange={onAgentFilterChange}
          />
        </div>
      </div>
    </Card>
  );
}
