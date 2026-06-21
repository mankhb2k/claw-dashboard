import { create } from "zustand";

import { projectApi } from "@/lib/api/project";
import { GATEWAY_READY_TIMEOUT_MS } from "@/lib/runtime/project-spawn";
import { isOssRuntime } from "@/lib/runtime/runtime-mode";
import {
  gatewayTimeoutErrorKey,
  SETUP_ERROR_KEYS,
  spawnTimeoutErrorKey,
} from "@/utils/setup/setup-i18n";

import type { Project, CreateProjectInput } from "@/schemas/project.schema";

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: (opts?: { silent?: boolean }) => Promise<void>;
  createProject: (input?: CreateProjectInput) => Promise<Project>;
  syncProjectHealth: (id: string) => Promise<void>;
  startProject: (id: string) => Promise<void>;
  respawnProject: (id: string) => Promise<Project>;
  stopProject: (id: string) => Promise<void>;
  destroyProject: (id: string) => Promise<void>;
  pollHealth: (id: string, onDone: (url: string | null) => void) => () => void;
  clearHealthPoll: (id: string) => void;
}

const healthPollHandles = new Map<string, ReturnType<typeof setInterval>>();

function stopHealthPoll(id: string): void {
  const handle = healthPollHandles.get(id);
  if (handle) {
    clearInterval(handle);
    healthPollHandles.delete(id);
  }
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async (opts) => {
    const silent = opts?.silent === true;
    if (!silent) {
      set({ isLoading: true, error: null });
    }
    try {
      const projects = await projectApi.list();
      set({ projects, error: null });
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err.message
            : SETUP_ERROR_KEYS.fetchProjects,
      });
    } finally {
      if (!silent) {
        set({ isLoading: false });
      }
    }
  },

  createProject: async (input = {}) => {
    const project = await projectApi.create(input);
    set((s) => ({
      projects: [project, ...s.projects.filter((p) => p.id !== project.id)],
    }));
    return project;
  },

  syncProjectHealth: async (id) => {
    const health = await projectApi.health(id);
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id
          ? {
              ...p,
              status: health.status,
              displayName: health.displayName ?? p.displayName,
              publicUrl: health.publicUrl ?? p.publicUrl,
              subdomain: health.subdomain ?? p.subdomain,
              containerMissing: health.containerMissing ?? false,
              errorMessage: health.errorMessage ?? null,
              lastActiveAt: health.lastActiveAt ?? p.lastActiveAt,
            }
          : p,
      ),
    }));
  },

  startProject: async (id) => {
    stopHealthPoll(id);
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, status: "starting" } : p,
      ),
    }));
    const updated = await projectApi.start(id);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? updated : p)),
    }));
    if (updated.status !== "running") {
      get().pollHealth(id, () => {});
    }
  },

  respawnProject: async (id) => {
    stopHealthPoll(id);
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, status: "creating", containerMissing: false } : p,
      ),
    }));
    const project = await projectApi.respawn(id);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? project : p)),
    }));
    if (project.status !== "running") {
      get().pollHealth(id, () => {});
    }
    return project;
  },

  stopProject: async (id) => {
    stopHealthPoll(id);
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, status: "stopping" } : p,
      ),
    }));
    const updated = await projectApi.stop(id);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? updated : p)),
    }));
    if (updated.status !== "stopped") {
      get().pollHealth(id, () => {});
    }
  },

  destroyProject: async (id) => {
    await projectApi.destroy(id);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },

  clearHealthPoll: (id) => {
    stopHealthPoll(id);
  },

  pollHealth: (id, onDone) => {
    stopHealthPoll(id);
    const pollStartedAt = Date.now();

    const applyHealth = (
      health: Awaited<ReturnType<typeof projectApi.health>>,
    ) => {
      const healthStatus = health.status;
      set((s) => ({
        projects: s.projects.map((p) =>
          p.id === id
            ? {
                ...p,
                status: healthStatus,
                containerMissing: health.containerMissing ?? false,
                errorMessage: health.errorMessage ?? null,
              }
            : p,
        ),
      }));
      if (healthStatus === "running") {
        if (isOssRuntime() || !health.containerMissing) {
          return health.publicUrl ?? null;
        }
      }
      if (
        healthStatus === "stopped" ||
        healthStatus === "error" ||
        (!isOssRuntime() && health.containerMissing)
      ) {
        return null;
      }
      return undefined;
    };

    const failPollTimeout = () => {
      const msg = isOssRuntime()
        ? gatewayTimeoutErrorKey()
        : spawnTimeoutErrorKey();
      stopHealthPoll(id);
      set((s) => ({
        projects: s.projects.map((p) =>
          p.id === id
            ? {
                ...p,
                status: "error",
                errorMessage: p.errorMessage ?? msg,
              }
            : p,
        ),
      }));
      onDone(null);
    };

    const tick = async () => {
      if (Date.now() - pollStartedAt >= GATEWAY_READY_TIMEOUT_MS) {
        failPollTimeout();
        return;
      }
      try {
        const health = await projectApi.health(id);
        const result = applyHealth(health);
        if (result !== undefined) {
          stopHealthPoll(id);
          onDone(result);
        }
      } catch {
        stopHealthPoll(id);
        onDone(null);
      }
    };

    void tick();
    const interval = setInterval(() => void tick(), 2000);
    healthPollHandles.set(id, interval);

    return () => stopHealthPoll(id);
  },
}));
