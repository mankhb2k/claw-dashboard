export const enChatToolActivity = {
  preparing: 'Preparing…',
  steps: {
    searchingFor: 'Searching for {{query}}',
    reading: 'Reading {{domain}}',
    runningCommand: 'Running command',
  },
  ui: {
    showMore: 'Show more',
    showLess: 'Show less',
    sources: 'Sources',
    args: 'Arguments',
    output: 'Output',
    running: 'Running',
    completed: 'Completed',
    failed: 'Failed',
    research: 'Research',
  },
  tools: {
    web_search: {
      running: 'Searching the web…',
      done: 'Web search completed',
      error: 'Web search failed',
    },
    web_fetch: {
      running: 'Fetching page…',
      done: 'Page fetched',
      error: 'Page fetch failed',
    },
    x_search: {
      running: 'Searching X…',
      done: 'X search completed',
      error: 'X search failed',
    },
    browser: {
      running: 'Using browser…',
      done: 'Browser action completed',
      error: 'Browser action failed',
    },
    exec: {
      running: 'Running command…',
      done: 'Command finished',
      error: 'Command failed',
    },
    code_execution: {
      running: 'Running Python…',
      done: 'Python execution finished',
      error: 'Python execution failed',
    },
    read: {
      running: 'Reading file…',
      done: 'File read',
      error: 'File read failed',
    },
    write: {
      running: 'Writing file…',
      done: 'File written',
      error: 'File write failed',
    },
    edit: {
      running: 'Editing file…',
      done: 'File edited',
      error: 'File edit failed',
    },
    apply_patch: {
      running: 'Applying patch…',
      done: 'Patch applied',
      error: 'Patch apply failed',
    },
    message: {
      running: 'Sending message…',
      done: 'Message sent',
      error: 'Message send failed',
    },
    sessions_list: {
      running: 'Listing sessions…',
      done: 'Sessions listed',
      error: 'List sessions failed',
    },
    sessions_history: {
      running: 'Loading history…',
      done: 'History loaded',
      error: 'Load history failed',
    },
    sessions_send: {
      running: 'Sending to session…',
      done: 'Sent to session',
      error: 'Send to session failed',
    },
    sessions_spawn: {
      running: 'Spawning session…',
      done: 'Session created',
      error: 'Spawn session failed',
    },
    subagents: {
      running: 'Starting sub-agent…',
      done: 'Sub-agent started',
      error: 'Sub-agent start failed',
    },
    agents_list: {
      running: 'Listing agents…',
      done: 'Agents listed',
      error: 'List agents failed',
    },
    session_status: {
      running: 'Checking session…',
      done: 'Session checked',
      error: 'Session check failed',
    },
    memory_search: {
      running: 'Searching memory…',
      done: 'Memory search done',
      error: 'Memory search failed',
    },
    memory_get: {
      running: 'Loading memory…',
      done: 'Memory loaded',
      error: 'Load memory failed',
    },
    image: {
      running: 'Analyzing image…',
      done: 'Image analyzed',
      error: 'Image analysis failed',
    },
    image_generate: {
      running: 'Generating image…',
      done: 'Image generated',
      error: 'Image generation failed',
    },
    video_generate: {
      running: 'Generating video…',
      done: 'Video generated',
      error: 'Video generation failed',
    },
    music_generate: {
      running: 'Generating music…',
      done: 'Music generated',
      error: 'Music generation failed',
    },
    tts: {
      running: 'Generating speech…',
      done: 'Speech generated',
      error: 'Speech generation failed',
    },
    cron: {
      running: 'Managing schedule…',
      done: 'Schedule updated',
      error: 'Schedule update failed',
    },
    gateway: {
      running: 'Gateway operation…',
      done: 'Gateway updated',
      error: 'Gateway operation failed',
    },
    canvas: {
      running: 'Updating canvas…',
      done: 'Canvas updated',
      error: 'Canvas update failed',
    },
    nodes: {
      running: 'Connecting device…',
      done: 'Device connected',
      error: 'Device connection failed',
    },
  },
  generic: {
    running: 'Running {{name}}…',
    done: 'Completed',
    error: 'Failed',
  },
} as const
