#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"

echo ""
echo "  AucoBot - Cài đặt và khởi động"
echo ""

if ! command -v docker >/dev/null 2>&1; then
  echo "[LỖI] Chưa cài Docker. Tải Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "[LỖI] Docker chưa chạy. Mở Docker Desktop rồi thử lại."
  exit 1
fi

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "[OK] Đã tạo .env từ .env.example"
  else
    echo "[LỖI] Thiếu .env và .env.example"
    exit 1
  fi
fi

echo "[1/3] Đang tải image..."
docker compose pull

echo "[2/3] Đang khởi động..."
docker compose up -d

echo "[3/3] Mở http://localhost:8386"
echo ""
echo "  Đăng nhập: admin / admin123"
echo "  Dừng: ./stop-aucobot.sh"
echo ""

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:8386" >/dev/null 2>&1 || true
elif command -v open >/dev/null 2>&1; then
  open "http://localhost:8386" >/dev/null 2>&1 || true
fi
