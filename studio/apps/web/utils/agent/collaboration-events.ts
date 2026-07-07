export const COLLABORATION_UPDATED_EVENT = "claw-dashboard:collaboration-updated";

export function notifyCollaborationUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COLLABORATION_UPDATED_EVENT));
}
