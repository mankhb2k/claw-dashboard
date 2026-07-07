#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"

docker compose down
echo "Đã dừng Claw Dashboard. Dữ liệu vẫn lưu trong Docker volumes."
