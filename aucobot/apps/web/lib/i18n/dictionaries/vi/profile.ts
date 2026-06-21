export const viProfile = {
  loadError: 'Không thể tải hồ sơ',
  unavailable: 'Hồ sơ không khả dụng',
  title: 'Hồ sơ',
  description: 'Quản lý tài khoản cá nhân. Cài đặt dự án nằm trong mục Cài đặt.',
  account: {
    title: 'Tài khoản',
    description: 'Danh tính đăng nhập và tên hiển thị trên dashboard.',
    displayName: {
      label: 'Tên hiển thị',
      description: 'Hiển thị trên sidebar và header hồ sơ.',
    },
    username: {
      label: 'Tên đăng nhập',
      description: 'Dùng để đăng nhập. Không thể thay đổi.',
    },
    memberSince: 'Thành viên từ',
    saved: 'Đã lưu',
    saveError: 'Không thể lưu',
    submit: 'Lưu thay đổi',
  },
  security: {
    title: 'Bảo mật',
    description: 'Cập nhật mật khẩu. Bạn vẫn đăng nhập trên thiết bị này.',
    currentPassword: 'Mật khẩu hiện tại',
    newPassword: 'Mật khẩu mới',
    confirmPassword: 'Xác nhận mật khẩu mới',
    saved: 'Đã cập nhật mật khẩu',
    saveError: 'Không thể cập nhật — kiểm tra mật khẩu hiện tại',
    submit: 'Cập nhật mật khẩu',
  },
  validation: {
    name: {
      required: 'Tên hiển thị là bắt buộc',
      max: 'Tối đa 64 ký tự',
    },
    password: {
      min: 'Mật khẩu tối thiểu 6 ký tự',
    },
    confirmPassword: {
      mismatch: 'Mật khẩu không khớp',
    },
    newPassword: {
      mustDiffer: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    },
  },
  avatar: {
    unsupportedType: 'Chỉ hỗ trợ ảnh JPEG, PNG, WebP hoặc GIF',
    tooLarge: 'Ảnh phải nhỏ hơn hoặc bằng 512 KB',
    stillTooLarge:
      'Ảnh vẫn trên 512 KB sau khi nén — hãy chọn file nhỏ hơn',
    uploadFailed: 'Tải avatar thất bại',
    changeAria: 'Đổi avatar',
  },
} as const
