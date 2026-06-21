import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AgentFormInput } from '@/schemas/agent-form.schema';

export type AgentEditTab =
  | 'identity'
  | 'instructions'
  | 'capabilities'
  | 'integrations'
  | 'schedules'
  | 'heartbeat';

/** localStorage key — keeps the old value so persist survives refactors. */
export const AGENT_EDITOR_LS_KEY = 'agent-editor-ui';

interface AgentEditorState {
  agentPanelOpen: boolean;
  setAgentPanelOpen: (open: boolean) => void;
  toggleAgentPanel: () => void;
  activeEditTab: AgentEditTab;
  setActiveEditTab: (tab: AgentEditTab) => void;
  formSnapshot: Partial<AgentFormInput> | null;
  setFormSnapshot: (data: Partial<AgentFormInput> | null) => void;
  pendingPanelMessage: string | null;
  requestPanelMessage: (message: string) => void;
  clearPendingPanelMessage: () => void;
  optimizeMode: boolean;
  requestOptimizeFlow: () => void;
  clearOptimizeMode: () => void;
}

export const useAgentEditorStore = create<AgentEditorState>()(
  persist(
    (set) => ({
      agentPanelOpen: true,
      setAgentPanelOpen: (agentPanelOpen) => set({ agentPanelOpen }),
      toggleAgentPanel: () =>
        set((state) => ({ agentPanelOpen: !state.agentPanelOpen })),
      activeEditTab: 'identity',
      setActiveEditTab: (activeEditTab) => set({ activeEditTab }),
      formSnapshot: null,
      setFormSnapshot: (formSnapshot) => set({ formSnapshot }),
      pendingPanelMessage: null,
      requestPanelMessage: (message) =>
        set({ pendingPanelMessage: message, agentPanelOpen: true }),
      clearPendingPanelMessage: () => set({ pendingPanelMessage: null }),
      optimizeMode: false,
      requestOptimizeFlow: () =>
        set({ optimizeMode: true, agentPanelOpen: true }),
      clearOptimizeMode: () => set({ optimizeMode: false }),
    }),
    {
      name: AGENT_EDITOR_LS_KEY,
      partialize: (state) => ({ agentPanelOpen: state.agentPanelOpen }),
      migrate: (persisted) => {
        const p = persisted as Record<string, unknown> | undefined;
        if (p && 'previewOpen' in p && !('agentPanelOpen' in p)) {
          return { ...p, agentPanelOpen: p.previewOpen };
        }
        return persisted as AgentEditorState;
      },
    },
  ),
);
