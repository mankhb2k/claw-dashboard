export const COLLABORATION_UPDATED_EVENT = "aucobot:collaboration-updated";

export function notifyCollaborationUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COLLABORATION_UPDATED_EVENT));
}
