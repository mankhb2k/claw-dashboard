export const enHttp = {
  sessionExpired: 'Your session has expired. Redirecting to sign in…',
  timeout: 'Request timed out.',
  networkError:
    'Cannot reach API ({{base}}). Check that the backend is running (npm run dev in the backend folder).',
  unknown: 'Unknown error',
  requestFailed: 'Request failed',
  apiError: 'API error',
} as const
