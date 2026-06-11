import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SkillSnapshot = {
  slug: string;
  name: string;
  description: string;
  heading: string | null;
  bodyMarkdown: string;
};

/** localStorage key — giữ giá trị cũ để không mất persist sau refactor. */
export const SKILL_EDITOR_LS_KEY = 'skill-editor-ui';

interface SkillEditorState {
  skillPanelOpen: boolean;
  setSkillPanelOpen: (open: boolean) => void;
  toggleSkillPanel: () => void;
  skillSnapshot: SkillSnapshot | null;
  setSkillSnapshot: (data: SkillSnapshot | null) => void;
  pendingPanelMessage: string | null;
  requestPanelMessage: (message: string) => void;
  clearPendingPanelMessage: () => void;
}

export const useSkillEditorStore = create<SkillEditorState>()(
  persist(
    (set) => ({
      skillPanelOpen: true,
      setSkillPanelOpen: (skillPanelOpen) => set({ skillPanelOpen }),
      toggleSkillPanel: () =>
        set((state) => ({ skillPanelOpen: !state.skillPanelOpen })),
      skillSnapshot: null,
      setSkillSnapshot: (skillSnapshot) => set({ skillSnapshot }),
      pendingPanelMessage: null,
      requestPanelMessage: (message) =>
        set({ pendingPanelMessage: message, skillPanelOpen: true }),
      clearPendingPanelMessage: () => set({ pendingPanelMessage: null }),
    }),
    {
      name: SKILL_EDITOR_LS_KEY,
      partialize: (state) => ({ skillPanelOpen: state.skillPanelOpen }),
    },
  ),
);
