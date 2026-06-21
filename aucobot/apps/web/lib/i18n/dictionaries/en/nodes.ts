export const enNodes = {
  page: {
    title: 'Companion Nodes',
    description:
      'Create invite codes, connect OpenClaw Node, and approve companion devices with the gateway.',
    loadInvitesFailed: 'Failed to load invite codes.',
    noProject: 'No project yet. Create one on Overview first.',
    loading: 'Loading...',
  },
  confirm: {
    removeTitle: 'Remove node from gateway?',
    removeDescription:
      'Are you sure you want to remove "{{title}}"? The device will disconnect from the gateway.',
    removeLabel: 'Remove',
    rejectDeviceTitle: 'Reject device pairing?',
    rejectDeviceDescription:
      'The device pairing request will be cancelled. The device must submit a new request to connect again.',
    rejectDeviceLabel: 'Reject',
    rejectNodeTitle: 'Reject node pairing?',
    rejectNodeDescription:
      'The node upgrade request will be cancelled. The node app must pair again after the device is approved.',
    rejectNodeLabel: 'Reject',
  },
  toasts: {
    newPairingTitle: 'New pairing request',
    newPairingDescription:
      'Approve device and node in the device manager card below.',
  },
  errors: {
    actionFailed: 'Action failed',
  },
} as const
