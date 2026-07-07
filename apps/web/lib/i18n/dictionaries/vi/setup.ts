export const viSetup = {
  opening: 'Đang mở dashboard…',
  errors: {
    fetchProjects: 'Không tải được danh sách project',
    noWorkspace: 'Chưa có workspace. Hãy tạo project trước.',
    openDashboard: 'Không thể mở dashboard',
    respawnFailed: 'Respawn thất bại',
    createWorkspace: 'Không thể tạo workspace',
    gatewayTimeout:
      'Gateway OpenClaw dùng chung chưa sẵn sàng sau {{seconds}} giây. Đảm bảo container gateway đang chạy trên cổng 18789 (xem deploy/docker-compose.gateway.dev.yml).',
    spawnTimeout:
      'Gateway OpenClaw chưa sẵn sàng sau {{seconds}} giây. Kiểm tra Docker Desktop đang chạy và thử Spawn lại.',
    gatewayUnreachable:
      'Không kết nối được gateway trên cổng 18789. Chạy Openclaw và khớp OPENCLAW_GATEWAY_TOKEN trong apps/.env.',
  },
  status: {
    oss: {
      creating: 'Đang chuẩn bị workspace…',
      starting: 'Đang kết nối gateway…',
      error: 'Lỗi thiết lập',
      running: 'Sẵn sàng',
    },
    cloud: {
      containerMissing: 'Container đã bị xóa — cần tạo lại',
      creating: 'Đang tạo container…',
      starting: 'Đang khởi động OpenClaw…',
      stopping: 'Đang dừng…',
      stopped: 'Đã dừng — khởi động container',
      error: 'Lỗi runtime',
      running: 'Sẵn sàng',
    },
  },
  create: {
    badge: 'Bước 1 · Một lần',
    title: 'Bắt đầu',
    description: {
      ossBefore:
        'Chúng tôi sẽ tạo workspace và kiểm tra gateway OpenClaw dùng chung tại',
      ossAfter:
        'Nếu gateway chưa chạy, bạn sẽ ở lại trang này với các bước khắc phục trước khi mở dashboard.',
      cloud:
        'Backend sẽ tạo workspace và khởi động container Docker OpenClaw. Nếu khởi động thất bại, bạn có thể thử lại từ trang này thay vì vào dashboard lỗi.',
    },
    submit: {
      oss: 'Tạo workspace',
      cloud: 'Tạo & khởi động container',
    },
  },
  resume: {
    badge: 'Đang chuẩn bị',
    title: 'Workspace của bạn',
    steps: {
      docker: 'Container Docker',
      gateway: 'Gateway OpenClaw',
    },
    buttons: {
      waitingGateway: 'Đang chờ gateway…',
      waitingContainer: 'Đang chờ container…',
      continueDashboard: 'Tiếp tục tới dashboard',
      startContainer: 'Khởi động container & mở dashboard',
      respawn: 'Respawn (nếu kẹt quá 1 phút)',
      checkGateway: 'Kiểm tra gateway lại',
    },
  },
  recreate: {
    badge: {
      spawnFailed: 'Spawn thất bại',
      containerMissing: 'Thiếu container',
    },
    title: {
      respawn: 'Respawn container',
      recreate: 'Tạo lại container',
    },
    description: {
      error:
        '— gateway chưa sẵn sàng kịp hoặc Docker lỗi. Respawn để tạo container mới.',
      missing: '— dữ liệu vẫn trên đĩa, nhưng container Docker đã mất.',
    },
    spawning: 'Đang spawn…',
    respawn: 'Respawn container',
  },
  recover: {
    badge: 'OSS · Gateway dùng chung',
    title: 'Cần kiểm tra gateway',
    description:
      'Workspace đã lưu ({{status}}). Khởi động gateway OpenClaw trên cổng 18789, rồi tiếp tục tới dashboard.',
    errorLabel: 'Lỗi:',
    checkingGateway: 'Đang kiểm tra gateway…',
    continueDashboard: 'Tiếp tục tới dashboard',
    checkGateway: 'Kiểm tra gateway lại',
  },
  footer: {
    hint: 'Project chỉ tạo một lần. Container dừng →',
    start: 'khởi động',
    missing: 'Thiếu container →',
    respawn: 'respawn',
  },
} as const
