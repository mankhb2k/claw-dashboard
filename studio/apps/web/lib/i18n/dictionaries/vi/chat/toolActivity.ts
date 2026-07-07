export const viChatToolActivity = {
  preparing: 'Đang chuẩn bị…',
  steps: {
    searchingFor: 'Đang tìm {{query}}',
    reading: 'Đang đọc {{domain}}',
    runningCommand: 'Đang chạy lệnh',
  },
  ui: {
    showMore: 'Xem thêm',
    showLess: 'Thu gọn',
    sources: 'Nguồn',
    args: 'Tham số',
    output: 'Kết quả',
    running: 'Đang chạy',
    completed: 'Hoàn tất',
    failed: 'Thất bại',
    research: 'Nghiên cứu',
  },
  tools: {
    web_search: {
      running: 'Đang tìm trên web…',
      done: 'Đã tìm xong trên web',
      error: 'Tìm web thất bại',
    },
    web_fetch: {
      running: 'Đang tải trang…',
      done: 'Đã tải trang',
      error: 'Tải trang thất bại',
    },
    x_search: {
      running: 'Đang tìm trên X…',
      done: 'Đã tìm xong trên X',
      error: 'Tìm trên X thất bại',
    },
    browser: {
      running: 'Đang dùng trình duyệt…',
      done: 'Đã hoàn tất thao tác trình duyệt',
      error: 'Thao tác trình duyệt thất bại',
    },
    exec: {
      running: 'Đang chạy lệnh…',
      done: 'Đã chạy xong lệnh',
      error: 'Chạy lệnh thất bại',
    },
    code_execution: {
      running: 'Đang chạy Python…',
      done: 'Đã chạy xong Python',
      error: 'Chạy Python thất bại',
    },
    read: {
      running: 'Đang đọc file…',
      done: 'Đã đọc file',
      error: 'Đọc file thất bại',
    },
    write: {
      running: 'Đang ghi file…',
      done: 'Đã ghi file',
      error: 'Ghi file thất bại',
    },
    edit: {
      running: 'Đang sửa file…',
      done: 'Đã sửa file',
      error: 'Sửa file thất bại',
    },
    apply_patch: {
      running: 'Đang áp dụng patch…',
      done: 'Đã áp dụng patch',
      error: 'Áp dụng patch thất bại',
    },
    message: {
      running: 'Đang gửi tin nhắn…',
      done: 'Đã gửi tin nhắn',
      error: 'Gửi tin nhắn thất bại',
    },
    sessions_list: {
      running: 'Đang liệt kê phiên…',
      done: 'Đã liệt kê phiên',
      error: 'Liệt kê phiên thất bại',
    },
    sessions_history: {
      running: 'Đang tải lịch sử…',
      done: 'Đã tải lịch sử',
      error: 'Tải lịch sử thất bại',
    },
    sessions_send: {
      running: 'Đang gửi tới phiên khác…',
      done: 'Đã gửi tới phiên khác',
      error: 'Gửi tới phiên khác thất bại',
    },
    sessions_spawn: {
      running: 'Đang tạo phiên…',
      done: 'Đã tạo phiên',
      error: 'Tạo phiên thất bại',
    },
    subagents: {
      running: 'Đang khởi chạy sub-agent…',
      done: 'Đã khởi chạy sub-agent',
      error: 'Khởi chạy sub-agent thất bại',
    },
    agents_list: {
      running: 'Đang liệt kê agent…',
      done: 'Đã liệt kê agent',
      error: 'Liệt kê agent thất bại',
    },
    session_status: {
      running: 'Đang kiểm tra phiên…',
      done: 'Đã kiểm tra phiên',
      error: 'Kiểm tra phiên thất bại',
    },
    memory_search: {
      running: 'Đang tìm trong bộ nhớ…',
      done: 'Đã tìm trong bộ nhớ',
      error: 'Tìm bộ nhớ thất bại',
    },
    memory_get: {
      running: 'Đang tải bộ nhớ…',
      done: 'Đã tải bộ nhớ',
      error: 'Tải bộ nhớ thất bại',
    },
    image: {
      running: 'Đang phân tích ảnh…',
      done: 'Đã phân tích ảnh',
      error: 'Phân tích ảnh thất bại',
    },
    image_generate: {
      running: 'Đang tạo ảnh…',
      done: 'Đã tạo ảnh',
      error: 'Tạo ảnh thất bại',
    },
    video_generate: {
      running: 'Đang tạo video…',
      done: 'Đã tạo video',
      error: 'Tạo video thất bại',
    },
    music_generate: {
      running: 'Đang tạo nhạc…',
      done: 'Đã tạo nhạc',
      error: 'Tạo nhạc thất bại',
    },
    tts: {
      running: 'Đang tạo giọng nói…',
      done: 'Đã tạo giọng nói',
      error: 'Tạo giọng nói thất bại',
    },
    cron: {
      running: 'Đang quản lý lịch…',
      done: 'Đã cập nhật lịch',
      error: 'Cập nhật lịch thất bại',
    },
    gateway: {
      running: 'Đang thao tác gateway…',
      done: 'Đã cập nhật gateway',
      error: 'Thao tác gateway thất bại',
    },
    canvas: {
      running: 'Đang cập nhật canvas…',
      done: 'Đã cập nhật canvas',
      error: 'Cập nhật canvas thất bại',
    },
    nodes: {
      running: 'Đang kết nối thiết bị…',
      done: 'Đã kết nối thiết bị',
      error: 'Kết nối thiết bị thất bại',
    },
  },
  generic: {
    running: 'Đang chạy {{name}}…',
    done: 'Hoàn tất',
    error: 'Thất bại',
  },
} as const
