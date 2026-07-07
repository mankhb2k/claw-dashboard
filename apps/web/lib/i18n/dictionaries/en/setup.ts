export const enSetup = {
  opening: 'Opening dashboard…',
  errors: {
    fetchProjects: 'Could not load projects',
    noWorkspace: 'No workspace yet. Create a project first.',
    openDashboard: 'Could not open dashboard',
    respawnFailed: 'Respawn failed',
    createWorkspace: 'Could not create workspace',
    gatewayTimeout:
      'Shared OpenClaw gateway is not ready after {{seconds}}s. Ensure the gateway container is running on port 18789 (see deploy/docker-compose.gateway.dev.yml).',
    spawnTimeout:
      'OpenClaw gateway is not ready after {{seconds}}s. Check that Docker Desktop is running and try Spawn again.',
    gatewayUnreachable:
      'Gateway is not reachable on port 18789. Run Openclaw and match OPENCLAW_GATEWAY_TOKEN in apps/.env.',
  },
  status: {
    oss: {
      creating: 'Preparing workspace…',
      starting: 'Connecting to gateway…',
      error: 'Setup error',
      running: 'Ready',
    },
    cloud: {
      containerMissing: 'Container removed — recreate required',
      creating: 'Creating container…',
      starting: 'Starting OpenClaw…',
      stopping: 'Stopping…',
      stopped: 'Stopped — start container',
      error: 'Runtime error',
      running: 'Ready',
    },
  },
  create: {
    badge: 'Step 1 · One time',
    title: 'Get started',
    description: {
      ossBefore:
        'We will create your workspace and verify the shared OpenClaw gateway at',
      ossAfter:
        'If the gateway is not running, you will stay on this page with steps to fix it before opening the dashboard.',
      cloud:
        'The backend will create your workspace and start an OpenClaw Docker container. If startup fails, you can retry from this page instead of landing on a broken dashboard.',
    },
    submit: {
      oss: 'Create workspace',
      cloud: 'Create & start container',
    },
  },
  resume: {
    badge: 'Preparing',
    title: 'Your workspace',
    steps: {
      docker: 'Docker container',
      gateway: 'OpenClaw gateway',
    },
    buttons: {
      waitingGateway: 'Waiting for gateway…',
      waitingContainer: 'Waiting for container…',
      continueDashboard: 'Continue to dashboard',
      startContainer: 'Start container & open dashboard',
      respawn: 'Respawn (if stuck over 1 min)',
      checkGateway: 'Check gateway again',
    },
  },
  recreate: {
    badge: {
      spawnFailed: 'Spawn failed',
      containerMissing: 'Container missing',
    },
    title: {
      respawn: 'Respawn container',
      recreate: 'Recreate container',
    },
    description: {
      error:
        '— gateway was not ready in time or Docker failed. Respawn to create a new container.',
      missing: '— data is kept on disk, but the Docker container is gone.',
    },
    spawning: 'Spawning…',
    respawn: 'Respawn container',
  },
  recover: {
    badge: 'OSS · Shared gateway',
    title: 'Gateway check required',
    description:
      'Your workspace is saved ({{status}}). Start the OpenClaw gateway on port 18789, then continue to the dashboard.',
    errorLabel: 'Error:',
    checkingGateway: 'Checking gateway…',
    continueDashboard: 'Continue to dashboard',
    checkGateway: 'Check gateway again',
  },
  footer: {
    hint: 'Project is created once. Stopped container →',
    start: 'start',
    missing: 'Missing container →',
    respawn: 'respawn',
  },
} as const
