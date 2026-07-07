export const viNodes = {
  page: {
    title: 'Companion Nodes',
    description:
      'Tạo mã mời, kết nối OpenClaw Node và phê duyệt thiết bị companion với gateway.',
    loadInvitesFailed: 'Không tải được mã mời.',
    noProject: 'Chưa có project. Hãy tạo từ Overview trước.',
    loading: 'Đang tải...',
  },
  confirm: {
    removeTitle: 'Gỡ node khỏi gateway?',
    removeDescription:
      'Bạn có chắc muốn gỡ "{{title}}"? Thiết bị sẽ ngắt kết nối khỏi gateway.',
    removeLabel: 'Gỡ',
    rejectDeviceTitle: 'Từ chối ghép cặp thiết bị?',
    rejectDeviceDescription:
      'Yêu cầu ghép cặp thiết bị sẽ bị hủy. Thiết bị phải gửi yêu cầu mới để kết nối lại.',
    rejectDeviceLabel: 'Từ chối',
    rejectNodeTitle: 'Từ chối ghép cặp node?',
    rejectNodeDescription:
      'Yêu cầu nâng cấp node sẽ bị hủy. Ứng dụng node phải ghép cặp lại sau khi thiết bị được duyệt.',
    rejectNodeLabel: 'Từ chối',
  },
  toasts: {
    newPairingTitle: 'Yêu cầu ghép cặp mới',
    newPairingDescription:
      'Duyệt thiết bị và node trong thẻ quản lý thiết bị bên dưới.',
  },
  errors: {
    actionFailed: 'Thao tác thất bại',
  },
} as const
