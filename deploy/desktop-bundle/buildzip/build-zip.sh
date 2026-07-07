#!/usr/bin/env sh
# Usage: ./build-zip.sh [version]
set -eu

VERSION="${1:-1.0.0}"
BUNDLE_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$(cd "$BUNDLE_DIR/.." && pwd)/dist"
STAGING="/tmp/claw-dashboard-desktop"
ZIP_NAME="claw-dashboard-desktop-${VERSION}.zip"
ZIP_PATH="$DIST_DIR/$ZIP_NAME"

rm -rf "$STAGING"
mkdir -p "$STAGING/scripts"

cp "$BUNDLE_DIR/docker-compose.yml" "$STAGING/"
if [ ! -f "$BUNDLE_DIR/.env" ]; then
  echo "[ERROR] Missing .env in desktop-bundle/"
  exit 1
fi
cp "$BUNDLE_DIR/.env" "$STAGING/"
cp "$BUNDLE_DIR/Run-Claw Dashboard.bat" "$STAGING/"
cp "$BUNDLE_DIR/Stop-Claw-Dashboard.bat" "$STAGING/"
cp "$BUNDLE_DIR/start-studio.sh" "$STAGING/"
cp "$BUNDLE_DIR/stop-studio.sh" "$STAGING/"
cp "$BUNDLE_DIR/HUONG-DAN.md" "$STAGING/"
cp "$BUNDLE_DIR/scripts/gateway-entrypoint.sh" "$STAGING/scripts/"
chmod +x "$STAGING/start-studio.sh" "$STAGING/stop-studio.sh" "$STAGING/scripts/gateway-entrypoint.sh"

mkdir -p "$DIST_DIR"
rm -f "$ZIP_PATH"
(cd /tmp && zip -r "$ZIP_PATH" claw-dashboard-desktop)

echo ""
echo "Created: $ZIP_PATH"
echo ""
echo "Upload: gh release create desktop-v${VERSION} \"$ZIP_PATH\" --title \"Claw Dashboard Desktop ${VERSION}\""
