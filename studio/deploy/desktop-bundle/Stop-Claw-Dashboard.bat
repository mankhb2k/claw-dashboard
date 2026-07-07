@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo.
echo  Dang dung Claw Dashboard...
docker compose down
if errorlevel 1 (
  echo [LOI] Khong dung duoc stack. Xem Docker Desktop.
  pause
  exit /b 1
)

echo.
echo  Claw Dashboard da dung. Du lieu van luu trong Docker volumes.
echo  Chay lai: Setup-Claw-Dashboard.bat
echo.
timeout /t 2 /nobreak >nul
exit /b 0
