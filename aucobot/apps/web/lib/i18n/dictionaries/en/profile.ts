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
} as const
