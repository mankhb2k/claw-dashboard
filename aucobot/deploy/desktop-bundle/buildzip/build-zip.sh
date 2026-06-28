#!/usr/bin/env sh
# Usage: ./build-zip.sh [version]
set -eu

VERSION="${1:-1.0.0}"
BUNDLE_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$(cd "$BUNDLE_DIR/.." && pwd)/dist"
STAGING="/tmp/aucobot-desktop"
ZIP_NAME="aucobot-desktop-${VERSION}.zip"
ZIP_PATH="$DIST_DIR/$ZIP_NAME"

rm -rf "$STAGING"
mkdir -p "$STAGING/scripts"

cp "$BUNDLE_DIR/docker-compose.yml" "$STAGING/"
if [ ! -f "$BUNDLE_DIR/.env" ]; then
  echo "[ERROR] Missing .env in desktop-bundle/"
  exit 1
fi
cp "$BUNDLE_DIR/.env" "$STAGING/"
cp "$BUNDLE_DIR/Run-AucoBot.bat" "$STAGING/"
cp "$BUNDLE_DIR/Dung-AucoBot.bat" "$STAGING/"
cp "$BUNDLE_DIR/start-aucobot.sh" "$STAGING/"
cp "$BUNDLE_DIR/stop-aucobot.sh" "$STAGING/"
cp "$BUNDLE_DIR/HUONG-DAN.md" "$STAGING/"
cp "$BUNDLE_DIR/scripts/gateway-entrypoint.sh" "$STAGING/scripts/"
chmod +x "$STAGING/start-aucobot.sh" "$STAGING/stop-aucobot.sh" "$STAGING/scripts/gateway-entrypoint.sh"

mkdir -p "$DIST_DIR"
rm -f "$ZIP_PATH"
(cd /tmp && zip -r "$ZIP_PATH" aucobot-desktop)

echo ""
echo "Created: $ZIP_PATH"
echo ""
echo "Upload: gh release create desktop-v${VERSION} \"$ZIP_PATH\" --title \"AucoBot Desktop ${VERSION}\""
