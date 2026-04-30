import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { authHandlers, projectHandlers } from './handlers'

const MOCK_ENABLED = true

function normalizePath(inputUrl: string): string {
  const raw = inputUrl.trim()
  if (!raw) return ''
  try {
    // Handle absolute URLs like http://localhost:3001/api/...
    return new URL(raw).pathname
  } catch {
    // Handle relative URLs like /api/...
    return raw.split('?')[0]
  }
}

function isMockRoute(url: string, method: string): boolean {
  const mockRoutes: Array<
    | { url: string; method: string }
    | { url: string; methods: string[] }
    | { pattern: RegExp; methods: string[] }
  > = [
    { url: '/api/auth/sign-in/email', method: 'post' },
    { url: '/api/auth/sign-up/email', method: 'post' },
    { url: '/api/auth/sign-out', method: 'post' },
    { url: '/api/auth/get-session', method: 'get' },
    { url: '/api/projects', methods: ['get', 'post'] },
    { url: '/api/projects/mine', methods: ['get'] },
    { pattern: /^\/api\/projects\/[\w-]+(\/start|\/stop|\/health|\/env|$)/, methods: ['get', 'post', 'put', 'delete'] },
  ]

  const baseUrl = normalizePath(url)
  const methodName = method.toLowerCase()

  return mockRoutes.some((route) => {
    let urlMatches = false
    if ('url' in route) {
      urlMatches = baseUrl === route.url
    } else {
      urlMatches = route.pattern.test(baseUrl)
    }

    const methods = 'methods' in route ? route.methods : [route.method]
    return urlMatches && methods.includes(methodName)
  })
}

export function setupMockInterceptor(api: AxiosInstance) {
  if (!MOCK_ENABLED) return

  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (isMockRoute(config.url ?? '', config.method ?? '')) {
      ;(config as { _isMocked?: boolean })._isMocked = true
    }
    return config
  })

  api.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (err) => {
      const config = err.config as InternalAxiosRequestConfig & { data?: unknown }
      if (!config || !isMockRoute(config.url ?? '', config.method ?? '')) {
        return Promise.reject(err)
      }

      try {
        let responseData: unknown = {}
        const method = config.method?.toLowerCase() ?? 'get'
        const rawUrl = config.url ?? ''
        const url = normalizePath(rawUrl)
        const reqData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data

        if (url === '/api/auth/sign-in/email' && method === 'post') {
          responseData = authHandlers.login({ config, data: reqData })
          return Promise.resolve({
            data: responseData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse)
        }

        if (url === '/api/auth/sign-up/email' && method === 'post') {
          responseData = authHandlers.register({ config, data: reqData })
          return Promise.resolve({
            data: responseData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse)
        }

        if (url === '/api/auth/sign-out' && method === 'post') {
          authHandlers.logout()
          return Promise.resolve({
            data: {},
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse)
        }

        if (url === '/api/auth/get-session' && method === 'get') {
          responseData = authHandlers.me()
          return Promise.resolve({
            data: responseData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse)
        }

        if ((url === '/api/projects' || url === '/api/projects/mine') && method === 'get') {
          responseData = projectHandlers.list()
          return Promise.resolve({
            data: responseData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse)
        }

        if (url === '/api/projects' && method === 'post') {
          responseData = projectHandlers.create({ config, data: reqData })
          return Promise.resolve({
            data: responseData,
            status: 201,
            statusText: 'Created',
            headers: {},
            config,
          } as AxiosResponse)
        }

        const projectMatch = url.match(/^\/api\/projects\/([\w-]+)\/(start|stop|health)$/)
        if (projectMatch && method === 'post') {
          const [, id, action] = projectMatch
          if (action === 'start') projectHandlers.start(id)
          if (action === 'stop') projectHandlers.stop(id)
          return Promise.resolve({
            data: {},
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse)
        }

        if (projectMatch && method === 'get' && projectMatch[2] === 'health') {
          const [, id] = projectMatch
          responseData = projectHandlers.health(id)
          return Promise.resolve({
            data: responseData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse)
        }

        const deleteMatch = url.match(/^\/api\/projects\/([\w-]+)$/)
        if (deleteMatch && method === 'delete') {
          const [, id] = deleteMatch
          projectHandlers.destroy(id)
          return Promise.resolve({
            data: {},
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse)
        }

        const envMatch = url.match(/^\/api\/projects\/([\w-]+)\/env$/)
        if (envMatch && method === 'put') {
          const [, id] = envMatch
          projectHandlers.upsertEnv(id, { config, data: reqData })
          return Promise.resolve({
            data: {},
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse)
        }

        return Promise.reject(new Error(`Mock endpoint not found: ${method.toUpperCase()} ${url}`))
      } catch (mockErr) {
        const message = mockErr instanceof Error ? mockErr.message : 'Mock API error'
        return Promise.reject(new Error(message))
      }
    }
  )
}

