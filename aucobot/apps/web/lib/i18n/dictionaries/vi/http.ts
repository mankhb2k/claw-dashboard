export const viHttp = {
  sessionExpired: 'Phiên đăng nhập hết hạn. Đang chuyển tới trang đăng nhập…',
  timeout: 'Request quá thời gian chờ.',
  networkError:
    'Không kết nối được API ({{base}}). Kiểm tra backend đang chạy (npm run dev trong thư mục backend).',
  unknown: 'Lỗi không xác định',
  requestFailed: 'Request thất bại',
  apiError: 'Lỗi API',
} as const
