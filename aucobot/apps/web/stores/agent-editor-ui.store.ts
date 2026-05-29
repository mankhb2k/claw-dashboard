import { create } from "zustand";
import { persist } from "zustand/middleware";

export const AGENT_EDITOR_UI_LS_KEY = "agent-editor-ui";

interface AgentEditorUiState {
  previewOpen: boolean;
  setPreviewOpen: (open: boolean) => void;
  togglePreview: () => void;
}

export const useAgentEditorUiStore = create<AgentEditorUiState>()(
  persist(
    (set) => ({
      previewOpen: true,
      setPreviewOpen: (previewOpen) => set({ previewOpen }),
      togglePreview: () =>
        set((state) => ({ previewOpen: !state.previewOpen })),
    }),
    { name: AGENT_EDITOR_UI_LS_KEY },
  ),
);
