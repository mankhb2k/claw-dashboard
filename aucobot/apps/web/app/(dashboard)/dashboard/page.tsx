'use client'

import { Flex, Grid, Container } from '@/components/layout'
import { MetricCard } from './_components/MetricCard/MetricCard'
import { OverviewChart } from './_components/OverviewChart/OverviewChart'
import { UsageTable } from './_components/UsageTable/UsageTable'
import { OverviewSchedulesCard } from './_components/OverviewSchedulesCard/OverviewSchedulesCard'
import { TOKEN_DATA, LATENCY_DATA, RECENT_CALLS, METRIC_STATS } from './fakedatadashboard'

export default function ProjectOverviewPage() {
  return (
    <Container size="lg">
      <Flex direction="column" gap={32} py="var(--space-8)">
        
        {/* Metric Cards Row */}
        <Grid columns={3} gap={24}>
          {METRIC_STATS.map((stat, idx) => (
            <MetricCard key={idx} {...stat} />
          ))}
        </Grid>

        <OverviewSchedulesCard />

        {/* Charts Row */}
        <Grid columns={2} gap={24}>
          <OverviewChart title="Token Usage" data={TOKEN_DATA} color="var(--color-primary)" />
          <OverviewChart title="Planned Income" data={LATENCY_DATA} color="#8b5cf6" />
        </Grid>

        {/* Table Row */}
        <UsageTable title="Recent Model Calls" data={RECENT_CALLS} />

      </Flex>
    </Container>
  )
}
