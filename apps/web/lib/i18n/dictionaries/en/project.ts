export const enProject = {
  errors: {
    invalidServerData: 'Invalid project data from server.',
  },
  validation: {
    displayName: {
      min: 'Name must be at least 1 character',
      max: 'Name must be at most 200 characters',
    },
  },
} as const
