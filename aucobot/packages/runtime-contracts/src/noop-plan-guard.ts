import type { PlanGuard } from './gateway-endpoint.js';

/** OSS default — no billing or quota checks. */
export class NoopPlanGuard implements PlanGuard {
  async assertCanCreateProject(_userId: string): Promise<void> {
    /* allow */
  }
}
