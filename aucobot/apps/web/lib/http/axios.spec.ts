import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/http/axios'

type TestWindow = {
  location: {
    pathname: string
    origin: string
    assign: ReturnType<typeof vi.fn>
  }
}

function unauthorized(config: InternalAxiosRequestConfig, message = 'Unauthorized'): AxiosError {
  return new AxiosError(
    message,
    undefined,
    config,
    undefined,
    {
      status: 401,
      statusText: 'Unauthorized',
      data: { message },
      headers: {},
      config,
    } as AxiosResponse,
  )
}

function ok<T>(config: InternalAxiosRequestConfig, data: T): AxiosResponse<T> {
  return {
    status: 200,
    statusText: 'OK',
    data,
    headers: {},
    config,
  }
}

function setWindow(pathname = '/dashboard'): TestWindow {
  const assign = vi.fn()
  const win: TestWindow = {
    location: {
      pathname,
      origin: 'http://localhost:8386',
      assign,
    },
  }
  vi.stubGlobal('window', win)
  return win
}

describe('api auth refresh interceptor', () => {
  const originalAdapter = api.defaults.adapter

  beforeAll(() => {
    api.defaults.baseURL = ''
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    api.defaults.adapter = originalAdapter
  })

  afterAll(() => {
    api.defaults.adapter = originalAdapter
  })

  it('retries original request after refresh success', async () => {
    const win = setWindow('/dashboard')
    let sessionCalls = 0
    let refreshCalls = 0

    api.defaults.adapter = async (config) => {
      if (config.url === '/api/auth/refresh') {
        refreshCalls += 1
        return ok(config, { ok: true })
      }
      if (config.url === '/api/auth/session') {
        sessionCalls += 1
        if (sessionCalls === 1) {
          throw unauthorized(config)
        }
        return ok(config, { success: true, data: { user: { id: 'u1' } } })
      }
      throw new Error(`Unhandled URL: ${config.url}`)
    }

    const res = await api.get<{ user: { id: string } }>('/api/auth/session')

    expect(refreshCalls).toBe(1)
    expect(sessionCalls).toBe(2)
    expect(res.data.user.id).toBe('u1')
    expect(win.location.assign).not.toHaveBeenCalled()
  })

  it('redirects to login when refresh fails', async () => {
    const win = setWindow('/dashboard/ai-model')
    let refreshCalls = 0

    api.defaults.adapter = async (config) => {
      if (config.url === '/api/auth/refresh') {
        refreshCalls += 1
        throw unauthorized(config, 'Refresh expired')
      }
      if (config.url === '/api/projects/mine') {
        throw unauthorized(config)
      }
      throw new Error(`Unhandled URL: ${config.url}`)
    }

    await expect(api.get('/api/projects/mine')).rejects.toThrow(
      'Your session has expired. Redirecting to sign in…',
    )
    expect(refreshCalls).toBe(1)
    expect(win.location.assign).toHaveBeenCalledWith('/login?session=expired')
  })

  it('does not attempt refresh for login endpoint 401', async () => {
    const win = setWindow('/login')
    let refreshCalls = 0

    api.defaults.adapter = async (config) => {
      if (config.url === '/api/auth/refresh') {
        refreshCalls += 1
        return ok(config, { ok: true })
      }
      if (config.url === '/api/auth/login') {
        throw unauthorized(config, 'Invalid credentials')
      }
      throw new Error(`Unhandled URL: ${config.url}`)
    }

    await expect(api.post('/api/auth/login', { username: 'u', password: 'x' })).rejects.toThrow(
      'Invalid credentials',
    )
    expect(refreshCalls).toBe(0)
    expect(win.location.assign).not.toHaveBeenCalled()
  })

  it('waits for peer tab refresh lock instead of calling refresh again', async () => {
    const win = setWindow('/dashboard')
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
    })
    storage.set(
      'oc_auth_refresh',
      JSON.stringify({ at: Date.now(), tabId: 'other-tab' }),
    )

    let refreshCalls = 0
    let projectCalls = 0

    api.defaults.adapter = async (config) => {
      if (config.url === '/api/auth/refresh') {
        refreshCalls += 1
        return ok(config, { ok: true })
      }
      if (config.url === '/api/projects/mine') {
        projectCalls += 1
        if (projectCalls === 1) {
          throw unauthorized(config)
        }
        return ok(config, { success: true, data: [] })
      }
      throw new Error(`Unhandled URL: ${config.url}`)
    }

    const res = await api.get('/api/projects/mine')

    expect(refreshCalls).toBe(0)
    expect(projectCalls).toBe(2)
    expect(res.data).toEqual([])
    expect(win.location.assign).not.toHaveBeenCalled()
  })
})
