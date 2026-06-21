export const viAuth = {
  brand: 'AUCOBOT',
  login: {
    title: 'Đăng nhập',
    subtitle: 'Tên đăng nhập + Mật khẩu',
    submit: 'Đăng nhập',
    failed: 'Đăng nhập thất bại',
    noAccount: 'Chưa có tài khoản?',
    registerLink: 'Đăng ký',
    sessionExpired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  },
  register: {
    title: 'Tạo tài khoản',
    subtitle: 'Self-host · Đăng ký bằng tên đăng nhập',
    submit: 'Tạo tài khoản',
    failed: 'Đăng ký thất bại',
    hasAccount: 'Đã có tài khoản?',
    loginLink: 'Đăng nhập',
  },
  fields: {
    username: {
      label: 'Tên đăng nhập',
      placeholder: 'admin',
    },
    password: {
      label: 'Mật khẩu',
      placeholder: '••••••••',
    },
    confirmPassword: {
      label: 'Xác nhận mật khẩu',
      placeholder: '••••••••',
    },
  },
  validation: {
    username: {
      min: 'Tối thiểu 3 ký tự',
      max: 'Tối đa 32 ký tự',
      pattern: 'Chỉ dùng chữ, số, gạch dưới và gạch ngang',
    },
    password: {
      min: 'Mật khẩu tối thiểu 6 ký tự',
    },
    confirmPassword: {
      mismatch: 'Mật khẩu không khớp',
    },
  },
  loginErrors: {
    accountNotFound: 'Tài khoản không tồn tại',
    wrongPassword: 'Mật khẩu không đúng',
  },
  registerErrors: {
    usernameTaken: 'Tên đăng nhập đã tồn tại',
  },
} as const
