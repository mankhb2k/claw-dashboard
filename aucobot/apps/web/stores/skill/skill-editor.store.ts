import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SkillSnapshot = {
  slug: string;
  name: string;
  description: string;
  heading: string | null;
  bodyMarkdown: string;
};

export const SKILL_EDITOR_LS_KEY = 'aucobot:skill-editor';
const LEGACY_SKILL_EDITOR_LS_KEY = 'skill-editor-ui';

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

function readPersistedPanelOpen(): boolean | null {
  if (typeof window === 'undefined') return null;
  for (const key of [SKILL_EDITOR_LS_KEY, LEGACY_SKILL_EDITOR_LS_KEY]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { state?: { skillPanelOpen?: boolean } };
      if (typeof parsed.state?.skillPanelOpen === 'boolean') {
        return parsed.state.skillPanelOpen;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ skillPanelOpen: state.skillPanelOpen }),
      onRehydrateStorage: () => (state) => {
        const legacyOpen = readPersistedPanelOpen();
        if (legacyOpen !== null && state) {
          state.setSkillPanelOpen(legacyOpen);
        }
      },
    },
  ),
);
