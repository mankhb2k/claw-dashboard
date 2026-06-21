export const enAuth = {
  brand: 'AUCOBOT',
  login: {
    title: 'Login',
    subtitle: 'Username + Password',
    submit: 'Login',
    failed: 'Login failed',
    noAccount: "Don't have an account?",
    registerLink: 'Register',
    sessionExpired: 'Your session has expired. Please sign in again.',
  },
  register: {
    title: 'Create account',
    subtitle: 'Self-host · Register by username',
    submit: 'Create account',
    failed: 'Registration failed',
    hasAccount: 'Already have an account?',
    loginLink: 'Login',
  },
  fields: {
    username: {
      label: 'Username',
      placeholder: 'admin',
    },
    password: {
      label: 'Password',
      placeholder: '••••••••',
    },
    confirmPassword: {
      label: 'Confirm password',
      placeholder: '••••••••',
    },
  },
  validation: {
    username: {
      min: 'At least 3 characters',
      max: 'At most 32 characters',
      pattern: 'Use letters, numbers, underscores, and hyphens only',
    },
    password: {
      min: 'Password must be at least 6 characters',
    },
    confirmPassword: {
      mismatch: 'Passwords do not match',
    },
  },
  loginErrors: {
    accountNotFound: 'Account does not exist',
    wrongPassword: 'Incorrect password',
  },
  registerErrors: {
    usernameTaken: 'Username already exists',
  },
} as const
