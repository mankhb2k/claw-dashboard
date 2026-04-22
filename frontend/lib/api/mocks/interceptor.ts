import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { authHandlers, projectHandlers } from './handlers'

const MOCK_ENABLED = process.env.NEXT_PUBLIC_MOCK_API === 'true'

function isMockRoute(url: string, method: string): boolean {
  const mockRoutes: Array<
    | { url: string; method: string }
    | { url: string; methods: string[] }
    | { pattern: RegExp; methods: string[] }
  > = [
    { url: '/api/auth/login', method: 'post' },
    { url: '/api/auth/register', method: 'post' },
    { url: '/api/auth/logout', method: 'post' },
    { url: '/api/auth/me', method: 'get' },
    { url: '/api/projects', methods: ['get', 'post'] },
    { pattern: /^\/api\/projects\/[\w-]+(\/start|\/stop|\/health|$)/, methods: ['get', 'post', 'delete'] },
  ]

  const baseUrl = url.split('?')[0]
  const method_ = method.toLowerCase()

  return mockRoutes.some((route) => {
    let urlMatches = false
    if ('url' in route) {
      urlMatches = baseUrl === route.url
    } else if ('pattern' in route) {
      urlMatches = route.pattern.test(baseUrl)
    }

    const methods =
      'methods' in route ? route.methods : 'method' in route ? [route.method] : []
    const methodMatches = methods.includes(method_)

    return urlMatches && methodMatches
  })
}

export function setupMockInterceptor(api: AxiosInstance) {
  if (!MOCK_ENABLED) return

  // Intercept requests at request level
  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Mark mock requests so we can handle them
    if (isMockRoute(config.url ?? '', config.method ?? '')) {
      ;(config as any)._isMocked = true
    }
    return config
  })

  // Handle mock responses
  api.interceptors.response.use(
    (res: AxiosResponse) => {
      // If this was a mocked request, just return the response as-is
      if ((res.config as any)._isMocked) {
        return res
      }
      return res
    },
    async (err) => {
      const config = err.config as any
      if (!config || !isMockRoute(config.url ?? '', config.method ?? '')) {
        return Promise.reject(err)
      }

      try {
        let responseData: any = {}
        const method = config.method?.toLowerCase() ?? 'get'
        const url = config.url ?? ''

        console.log(`[Mock API] ${method.toUpperCase()} ${url}`)

        // Auth routes
        if (url === '/api/auth/login' && method === 'post') {
          responseData = authHandlers.login({ config, data: config.data })
          return Promise.resolve({
            data: responseData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse)
        }

        if (url === '/api/auth/register' && method === 'post') {
          responseData = authHandlers.register({ config, data: config.data })
          return Promise.resolve({
            data: responseData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse)
        }

        if (url === '/api/auth/logout' && method === 'post') {
          authHandlers.logout()
          return Promise.resolve({
            data: {},
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse)
        }

        if (url === '/api/auth/me' && method === 'get') {
          responseData = authHandlers.me()
          return Promise.resolve({
            data: responseData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse)
        }

        // Project routes
        if (url === '/api/projects' && method === 'get') {
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
          responseData = projectHandlers.create({ config, data: config.data })
          return Promise.resolve({
            data: responseData,
            status: 201,
            statusText: 'Created',
            headers: {},
            config,
          } as AxiosResponse)
        }

        // Project actions
        const projectMatch = url.match(/^\/api\/projects\/([\w-]+)\/(start|stop|health)$/)
        if (projectMatch && method === 'post') {
          const [, id, action] = projectMatch
          if (action === 'start') {
            projectHandlers.start(id)
          } else if (action === 'stop') {
            projectHandlers.stop(id)
          }
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

        // Delete project
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

        console.warn(`[Mock API] No handler for ${method.toUpperCase()} ${url}`)
        return Promise.reject(new Error(`Mock endpoint not found: ${method.toUpperCase()} ${url}`))
      } catch (mockErr) {
        const message = mockErr instanceof Error ? mockErr.message : 'Mock API error'
        console.error(`[Mock API Error]`, message)
        return Promise.reject(new Error(message))
      }
    }
  )
}
