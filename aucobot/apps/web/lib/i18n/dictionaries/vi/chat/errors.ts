export const viChatErrors = {
  loadSessions: 'Không tải được danh sách phiên chat',
  agentError: 'Agent trả lỗi khi xử lý tin nhắn của bạn',
  wsSessionExpired:
    'WebSocket bị từ chối (phiên hết hạn). Đăng xuất và đăng nhập lại, hoặc tải lại trang.',
  gatewayNotReady: 'Gateway chưa sẵn sàng. Đợi vài giây rồi bấm Thử lại.',
  gatewayUnreachable:
    'Không kết nối được gateway. Kiểm tra container worker và WebSocket proxy.',
  gatewayUnreachableOss:
    'Không kết nối được gateway dùng chung. Đảm bảo aucobot-gateway-dev chạy trên cổng 18789 và API proxy đã bật.',
  changeModel: 'Không đổi được model',
  changeThinking: 'Không đổi được mức thinking',
  loadModelCatalog: 'Không tải được danh mục model',
  noSessionKey: 'Gateway không trả session key',
  createSession: 'Không tạo được phiên chat mới',
  renameSession: 'Không đổi tên được phiên chat',
  cannotDeleteMain: 'Không thể xóa phiên chính',
  deleteSession: 'Không xóa được phiên chat',
  loadStatus: 'Không tải được trạng thái chat',
  loadHistory: 'Không tải được lịch sử chat',
  sendMessage: 'Gửi tin nhắn thất bại',
  uploadFailed: 'Tải lên thất bại',
  uploadFailedStatus: 'Tải lên thất bại ({{status}})',
  noProjectUpload: 'Chưa chọn project để tải file lên.',
  deleteAttachment: 'Không xóa được tệp đính kèm',
  noProject: 'Chưa có project. Hãy tạo từ Overview trước.',
} as const
