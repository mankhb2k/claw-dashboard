"use client";

import React from "react";
import { Card, Select } from "@/components/ui";
import { SearchItem } from "@/components/dashboard";
import styles from "./CardSchedulesFilters.module.css";

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
  return (
    <Card className={styles.card} disableHover>
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <SearchItem
            id="project-schedule-search"
            value={search}
            onChange={onSearchChange}
            placeholder="Search schedules..."
            maxWidth="100%"
          />
        </div>
        <div className={styles.agentFilter}>
          <Select
            id="project-schedule-agent-filter"
            label="Agent"
            options={agentFilterOptions}
            value={agentFilter}
            onValueChange={onAgentFilterChange}
          />
        </div>
      </div>
    </Card>
  );
}
