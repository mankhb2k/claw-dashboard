export const enSettings = {
  general: {
    title: 'General settings',
    projectName: {
      label: 'Project name',
      description: 'Display name used across the system.',
      placeholder: 'Enter project name...',
      validation: {
        min: 'Project name must be at least 3 characters',
        max: 'Project name must be at most 50 characters',
      },
    },
    projectId: {
      label: 'Project ID',
      description: 'Unique identifier for this project.',
      copyAria: 'Copy project ID',
    },
    subdomain: {
      label: 'Subdomain',
      description: 'Subdomain dedicated to this project.',
      copyAria: 'Copy subdomain',
    },
    language: {
      label: 'Language',
      description: 'Choose your preferred language for the interface.',
      options: {
        en: 'English',
        vi: 'Tiếng Việt',
      },
    },
    createdAt: {
      label: 'Created at',
    },
    save: {
      submit: 'Save changes',
      saving: 'Saving...',
      saved: 'Saved',
      error: 'Something went wrong. Please try again.',
    },
  },
  sandbox: {
    title: 'Sandbox',
    enable: {
      label: 'Enable project sandbox',
      description:
        'Run shell commands inside Docker. Choose whether sandbox applies to all agents or only selected ones.',
      aria: 'Enable project sandbox',
    },
    isolation: {
      label: 'Isolation scope',
      descriptionAll: 'All agents',
      descriptionAllDetail: 'every agent uses Docker sandbox.',
      descriptionSelected: 'Selected agents only',
      descriptionSelectedDetail: 'pick who uses Docker.',
    },
    mode: {
      all: 'All agents',
      selected: 'Selected agents only',
    },
    allModeHint: 'All agents use Docker sandbox.',
    disabledHint: 'Turn on project sandbox to configure agent placement.',
    callout:
      'The docker backend requires the gateway to reach Docker (socket or DinD). Sandbox changes where commands run, not whether agents can use shell tools.',
    configErrorSuffix: 'Sandbox settings could not be loaded from the server.',
    picker: {
      searchPlaceholder: 'Search agents...',
      loadingAgents: 'Loading agents...',
      noAgents: 'No agents found for this project.',
      createAgent: 'Create an agent',
      noMatch: 'No agents match your search.',
      useDocker: 'Use Docker sandbox',
      useDockerFor: 'Use Docker sandbox for {{name}}',
      summaryEmpty:
        'Turn on Docker sandbox per agent. Agents left off run on the gateway host.',
      summaryOne: '{{count}} of {{total}} agent uses Sandbox.',
      summaryMany: '{{count}} of {{total}} agents use Sandbox.',
    },
    errors: {
      loadAgents: 'Cannot load agents',
      loadSettings: 'Cannot load sandbox settings',
    },
    save: {
      submit: 'Save changes',
      saving: 'Saving...',
      saved: 'Saved',
      error: 'Something went wrong. Try again.',
    },
  },
  shellExec: {
    title: 'Shell execution',
    approval: {
      label: 'Approval policy',
      description:
        'Project-wide shell policy synced to tools.exec. Applies to all agents that are allowed to run shell commands.',
    },
    policy: {
      alwaysAsk: 'Always ask',
      standard: 'Standard',
      automatic: 'Automatic',
      hintAlways: 'Agents must request approval before running any shell command.',
      hintOnMiss: 'Only commands outside the fast-path list require approval.',
      hintOff: 'Commands may run without approval. Use only with trusted workloads.',
    },
    fastPath: {
      label: 'Fast-path utilities',
      description:
        'Stdin-only utilities that may run without approval when policy is Standard. Interpreters belong in exec approvals, not this list.',
      placeholderEmpty: 'Enter a command and press Enter...',
      placeholderAdd: 'Add command...',
      removeAria: 'Remove {{bin}}',
      interpreterWarning: 'Avoid interpreters in fast-path: {{list}}',
    },
    timeout: {
      label: 'Default timeout',
      description: 'Maximum seconds a shell command may run before the gateway stops it.',
    },
    save: {
      submit: 'Save changes',
      saving: 'Saving...',
      saved: 'Saved',
      error: 'Something went wrong. Try again.',
    },
  },
  gateway: {
    title: 'Gateway Status',
    warning:
      'Do not share the Gateway Token or Control UI links that include a token. Anyone with access can control your bot.',
    token: {
      label: 'Gateway Token',
      description: 'Authentication token for API and WebSocket connections.',
      show: 'Show',
      hide: 'Hide',
      copy: 'Copy',
      copied: 'Copied',
      loading: 'Loading...',
    },
    status: {
      label: 'Gateway status',
      description: 'Current state of the gateway worker.',
      creating: 'Creating',
      running: 'Running',
      starting: 'Starting',
      stopping: 'Stopping',
      stopped: 'Stopped',
      error: 'Error',
      start: 'Start',
      stop: 'Stop',
      respawn: 'Respawn',
      processing: 'Processing...',
    },
    url: {
      label: 'Gateway URL',
      descriptionLocal: 'Local gateway address for API, WebSocket, and Control UI.',
      descriptionPublic: 'Public gateway address for API, WebSocket, and Control UI.',
      copyAria: 'Copy Gateway URL',
      openControlUi: 'Open Control UI',
      opening: 'Opening...',
      copyLink: 'Copy link',
      linkCopied: 'Link copied',
    },
    errors: {
      start: 'Unable to start the container.',
      respawn: 'Unable to respawn the container.',
      stop: 'Unable to stop the container.',
      fetchToken: 'Unable to fetch token. Please try again.',
      openControlUi: 'Unable to open Control UI. Try again after the gateway is running.',
      copyControlUi: 'Unable to copy Control UI link.',
    },
  },
  dangerZone: {
    title: 'Delete project',
    description: 'Permanently remove your project and its database',
    warningTitle: 'Deleting this project will also remove your database.',
    warningDetail: 'Make sure you have made a backup if you want to keep your data.',
    blockHint: 'Stop the container before deleting.',
    deleteButton: 'Delete project',
    dialog: {
      title: 'Delete project?',
      body:
        'This action cannot be undone. All project data, channel connections, skills, and configuration will be permanently deleted.',
      confirmLabel: 'Type the project name',
      confirmSuffix: 'to confirm:',
      cancel: 'Cancel',
      deleting: 'Deleting...',
      deletePermanently: 'Delete permanently',
    },
    errors: {
      delete: 'Could not delete project. Please try again.',
    },
  },
  page: {
    projectNotFound: 'Project not found.',
  },
} as const
