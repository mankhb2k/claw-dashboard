import type { CronJob } from "@/schemas/cron.schema";

export function cronJobMessage(job: CronJob): string {
  if (job.payload.kind === "agentTurn" && job.payload.message) {
    return job.payload.message;
  }
  if (job.payload.kind === "systemEvent" && job.payload.text) {
    return job.payload.text;
  }
  return "";
}

export function formatCronSchedule(job: CronJob): string {
  const { schedule } = job;
  if (schedule.kind === "cron") {
    return `Cron: ${schedule.expr}`;
  }
  if (schedule.kind === "every") {
    const minutes = Math.round(schedule.everyMs / 60_000);
    if (minutes < 60) {
      return `Every ${minutes} min`;
    }
    const hours = Math.round(minutes / 60);
    return `Every ${hours} h`;
  }
  return `Once: ${schedule.at}`;
}

export function formatNextRun(job: CronJob): string {
  const ms = job.state?.nextRunAtMs;
  if (!ms) {
    return job.enabled ? "Pending" : "Paused";
  }
  return new Date(ms).toLocaleString();
}

export function lastRunStatus(job: CronJob): string | undefined {
  return job.state?.lastRunStatus ?? job.state?.lastStatus;
}

export function isCronJobFailed(job: CronJob): boolean {
  const status = lastRunStatus(job);
  return status === "error" || status === "failed";
}
