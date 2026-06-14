export const viSettings = {
  general: {
    title: 'Cài đặt chung',
    projectName: {
      label: 'Tên dự án',
      description: 'Tên hiển thị được dùng trong toàn hệ thống.',
      placeholder: 'Nhập tên dự án...',
      validation: {
        min: 'Tên dự án phải có ít nhất 3 ký tự',
        max: 'Tên dự án tối đa 50 ký tự',
      },
    },
    projectId: {
      label: 'ID dự án',
      description: 'Mã định danh duy nhất cho dự án này.',
      copyAria: 'Sao chép ID dự án',
    },
    subdomain: {
      label: 'Tên miền phụ',
      description: 'Tên miền phụ dành riêng cho dự án này.',
      copyAria: 'Sao chép tên miền phụ',
    },
    language: {
      label: 'Ngôn ngữ',
      description: 'Chọn ngôn ngữ ưa thích cho giao diện.',
      options: {
        en: 'English',
        vi: 'Tiếng Việt',
      },
    },
    createdAt: {
      label: 'Ngày tạo',
    },
    save: {
      submit: 'Lưu thay đổi',
      saving: 'Đang lưu...',
      saved: 'Đã lưu',
      error: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    },
  },
  sandbox: {
    title: 'Sandbox',
    enable: {
      label: 'Bật sandbox dự án',
      description:
        'Chạy lệnh shell trong Docker. Chọn sandbox áp dụng cho tất cả agent hay chỉ agent được chọn.',
      aria: 'Bật sandbox dự án',
    },
    isolation: {
      label: 'Phạm vi cô lập',
      descriptionAll: 'Tất cả agent',
      descriptionAllDetail: 'mọi agent dùng Docker sandbox.',
      descriptionSelected: 'Chỉ agent được chọn',
      descriptionSelectedDetail: 'chọn agent nào dùng Docker.',
    },
    mode: {
      all: 'Tất cả agent',
      selected: 'Chỉ agent được chọn',
    },
    allModeHint: 'Tất cả agent dùng Docker sandbox.',
    disabledHint: 'Bật sandbox dự án để cấu hình vị trí agent.',
    callout:
      'Backend docker yêu cầu gateway truy cập Docker (socket hoặc DinD). Sandbox thay đổi nơi chạy lệnh, không thay đổi việc agent có thể dùng shell tools hay không.',
    configErrorSuffix: 'Không thể tải cài đặt sandbox từ máy chủ.',
    picker: {
      searchPlaceholder: 'Tìm agent...',
      loadingAgents: 'Đang tải agent...',
      noAgents: 'Không tìm thấy agent cho dự án này.',
      createAgent: 'Tạo agent',
      noMatch: 'Không có agent khớp tìm kiếm.',
      useDocker: 'Dùng Docker sandbox',
      useDockerFor: 'Dùng Docker sandbox cho {{name}}',
      summaryEmpty:
        'Bật Docker sandbox theo từng agent. Agent tắt sẽ chạy trên gateway host.',
      summaryOne: '{{count}} / {{total}} agent dùng Sandbox.',
      summaryMany: '{{count}} / {{total}} agent dùng Sandbox.',
    },
    errors: {
      loadAgents: 'Không thể tải agent',
      loadSettings: 'Không thể tải cài đặt sandbox',
    },
    save: {
      submit: 'Lưu thay đổi',
      saving: 'Đang lưu...',
      saved: 'Đã lưu',
      error: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    },
  },
  shellExec: {
    title: 'Thực thi shell',
    approval: {
      label: 'Chính sách phê duyệt',
      description:
        'Chính sách shell toàn dự án đồng bộ với tools.exec. Áp dụng cho mọi agent được phép chạy lệnh shell.',
    },
    policy: {
      alwaysAsk: 'Luôn hỏi',
      standard: 'Tiêu chuẩn',
      automatic: 'Tự động',
      hintAlways: 'Agent phải xin phép trước khi chạy bất kỳ lệnh shell nào.',
      hintOnMiss: 'Chỉ lệnh ngoài danh sách fast-path cần phê duyệt.',
      hintOff: 'Lệnh có thể chạy không cần phê duyệt. Chỉ dùng với workload đáng tin.',
    },
    fastPath: {
      label: 'Tiện ích fast-path',
      description:
        'Tiện ích chỉ stdin có thể chạy không cần phê duyệt khi chính sách là Tiêu chuẩn. Interpreter thuộc exec approvals, không thuộc danh sách này.',
      placeholderEmpty: 'Nhập lệnh và nhấn Enter...',
      placeholderAdd: 'Thêm lệnh...',
      removeAria: 'Xóa {{bin}}',
      interpreterWarning: 'Tránh interpreter trong fast-path: {{list}}',
    },
    timeout: {
      label: 'Timeout mặc định',
      description: 'Số giây tối đa lệnh shell chạy trước khi gateway dừng.',
    },
    save: {
      submit: 'Lưu thay đổi',
      saving: 'Đang lưu...',
      saved: 'Đã lưu',
      error: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    },
  },
  gateway: {
    title: 'Trạng thái Gateway',
    warning:
      'Không chia sẻ Gateway Token hoặc liên kết Control UI có token. Ai có quyền truy cập có thể điều khiển bot của bạn.',
    token: {
      label: 'Gateway Token',
      description: 'Token xác thực cho kết nối API và WebSocket.',
      show: 'Hiện',
      hide: 'Ẩn',
      copy: 'Sao chép',
      copied: 'Đã sao chép',
      loading: 'Đang tải...',
    },
    status: {
      label: 'Trạng thái gateway',
      description: 'Trạng thái hiện tại của worker gateway.',
      creating: 'Đang tạo',
      running: 'Đang chạy',
      starting: 'Đang khởi động',
      stopping: 'Đang dừng',
      stopped: 'Đã dừng',
      error: 'Lỗi',
      start: 'Khởi động',
      stop: 'Dừng',
      respawn: 'Tạo lại',
      processing: 'Đang xử lý...',
    },
    url: {
      label: 'Gateway URL',
      descriptionLocal: 'Địa chỉ gateway cục bộ cho API, WebSocket và Control UI.',
      descriptionPublic: 'Địa chỉ gateway công khai cho API, WebSocket và Control UI.',
      copyAria: 'Sao chép Gateway URL',
      openControlUi: 'Mở Control UI',
      opening: 'Đang mở...',
      copyLink: 'Sao chép liên kết',
      linkCopied: 'Đã sao chép liên kết',
    },
    errors: {
      start: 'Không thể khởi động container.',
      respawn: 'Không thể tạo lại container.',
      stop: 'Không thể dừng container.',
      fetchToken: 'Không thể lấy token. Vui lòng thử lại.',
      openControlUi: 'Không thể mở Control UI. Thử lại sau khi gateway đang chạy.',
      copyControlUi: 'Không thể sao chép liên kết Control UI.',
    },
  },
  dangerZone: {
    title: 'Xóa dự án',
    description: 'Xóa vĩnh viễn dự án và cơ sở dữ liệu của bạn',
    warningTitle: 'Xóa dự án này cũng sẽ xóa cơ sở dữ liệu của bạn.',
    warningDetail: 'Hãy sao lưu nếu bạn muốn giữ dữ liệu.',
    blockHint: 'Dừng container trước khi xóa.',
    deleteButton: 'Xóa dự án',
    dialog: {
      title: 'Xóa dự án?',
      body:
        'Hành động này không thể hoàn tác. Mọi dữ liệu dự án, kết nối kênh, skills và cấu hình sẽ bị xóa vĩnh viễn.',
      confirmLabel: 'Nhập tên dự án',
      confirmSuffix: 'để xác nhận:',
      cancel: 'Hủy',
      deleting: 'Đang xóa...',
      deletePermanently: 'Xóa vĩnh viễn',
    },
    errors: {
      delete: 'Không thể xóa dự án. Vui lòng thử lại.',
    },
  },
  page: {
    projectNotFound: 'Không tìm thấy dự án.',
  },
} as const
