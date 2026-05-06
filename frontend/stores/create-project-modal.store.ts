import { create } from 'zustand'

type CreateProjectModalSource = 'dashboard' | 'projects' | 'other'

interface CreateProjectModalState {
  isOpen: boolean
  source: CreateProjectModalSource
  open: (source?: CreateProjectModalSource) => void
  close: () => void
}

export const useCreateProjectModalStore = create<CreateProjectModalState>((set) => ({
  isOpen: false,
  source: 'other',
  open: (source = 'other') => set({ isOpen: true, source }),
  close: () => set({ isOpen: false }),
}))
