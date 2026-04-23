export const AppEvents = {
  // Project lifecycle
  PROJECT_CREATED:  'project.created',
  PROJECT_STARTED:  'project.started',
  PROJECT_STOPPED:  'project.stopped',
  PROJECT_DELETED:  'project.deleted',
  // Heavy jobs
  HEAVY_JOB_SUBMITTED:  'heavy-job.submitted',
  HEAVY_JOB_CANCELLED:  'heavy-job.cancelled',
} as const;

export type AppEventName = typeof AppEvents[keyof typeof AppEvents];

// ── Payload types ─────────────────────────────────────────────────────────────

export interface ProjectCreatedEvent {
  projectId: string;
  userId: string;
  subdomain: string;
  planName: string;
}

export interface ProjectStartedEvent {
  projectId: string;
  userId: string;
}

export interface ProjectStoppedEvent {
  projectId: string;
  userId: string;
}

export interface ProjectDeletedEvent {
  projectId: string;
  userId: string;
}

export interface HeavyJobSubmittedEvent {
  jobId: string;
  userId: string;
  projectId: string;
  tool: string;
}

export interface HeavyJobCancelledEvent {
  jobId: string;
  userId: string;
}
