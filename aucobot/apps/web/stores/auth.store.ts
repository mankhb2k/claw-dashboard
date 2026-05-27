import { create } from "zustand";
import { authApi } from "@/lib/api/auth";
import type { User, LoginInput, RegisterInput } from "@/schemas/auth.schema";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  fetchMe: async () => {
    try {
      const user = await authApi.me();
      set({ user, isInitialized: true });
    } catch {
      set({ user: null, isInitialized: true });
    }
  },

  login: async (input) => {
    set({ isLoading: true });
    try {
      const user = await authApi.login(input);
      set({ user, isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (input) => {
    set({ isLoading: true });
    try {
      const user = await authApi.register(input);
      set({ user, isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Backend tắt hoặc mock lỗi — vẫn xóa state client
    } finally {
      set({ user: null, isInitialized: true });
    }
  },
}));
