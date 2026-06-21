export const enProfile = {
  loadError: 'Could not load profile',
  unavailable: 'Profile unavailable',
  title: 'Profile',
  description: 'Manage your personal account. Project settings stay under Settings.',
  account: {
    title: 'Account',
    description: 'Your sign-in identity and display name across the dashboard.',
    displayName: {
      label: 'Display name',
      description: 'Shown in the sidebar and profile header.',
    },
    username: {
      label: 'Username',
      description: 'Used to sign in. Cannot be changed.',
    },
    memberSince: 'Member since',
    saved: 'Saved',
    saveError: 'Could not save',
    submit: 'Save changes',
  },
  security: {
    title: 'Security',
    description: 'Update your password. You will stay signed in on this device.',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    saved: 'Password updated',
    saveError: 'Could not update — check current password',
    submit: 'Update password',
  },
  validation: {
    name: {
      required: 'Name is required',
      max: 'Max 64 characters',
    },
    password: {
      min: 'Min 6 characters',
    },
    confirmPassword: {
      mismatch: 'Passwords do not match',
    },
    newPassword: {
      mustDiffer: 'New password must differ from current',
    },
  },
  avatar: {
    unsupportedType: 'Only JPEG, PNG, WebP, or GIF images are supported',
    tooLarge: 'Image must be 512 KB or smaller',
    stillTooLarge:
      'Image is still over 512 KB after compression — choose a smaller file',
    uploadFailed: 'Failed to upload avatar',
    changeAria: 'Change avatar',
  },
} as const
