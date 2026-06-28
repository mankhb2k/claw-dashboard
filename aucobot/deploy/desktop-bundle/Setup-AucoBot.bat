@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo.
echo  ========================================
echo   AucoBot - Cai dat va khoi dong
echo  ========================================
echo.

where docker >nul 2>&1
if errorlevel 1 (
  echo [LOI] Khong tim thay Docker. Hay cai Docker Desktop truoc:
  echo        https://www.docker.com/products/docker-desktop/
  pause
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo [LOI] Docker Desktop chua chay. Mo Docker Desktop roi chay lai file nay.
  pause
  exit /b 1
)

REM Kiem tra xung dot cong voi dev stack (pnpm dev:runtime / api tren host)
set "PORT_CONFLICT="
for %%P in (5432 8386 8387 18789) do (
  netstat -ano | findstr /R /C:":%%P .*LISTENING" >nul 2>&1
  if not errorlevel 1 set "PORT_CONFLICT=%%P"
)
if defined PORT_CONFLICT (
  echo [CANH BAO] Cong %PORT_CONFLICT% dang duoc dung.
  echo.
  echo  Desktop bundle can 4 cong: 5432, 8386, 8387, 18789.
  echo  Neu ban dang chay dev ^(pnpm dev:runtime hoac api/web tren host^):
  echo    1. Dung dev stack truoc ^(Ctrl+C api/web, docker compose runtime down^)
  echo    2. Hoac chay Dung-AucoBot.bat neu stack cu con treo
  echo.
  echo  Tiep tuc co the that bai. Nhan phim bat ky de thu lai hoac Ctrl+C de huy...
  pause >nul
)

if not exist ".env" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env" >nul
    echo [OK] Da tao file .env tu .env.example
    echo      Ban co the sua mat khau trong .env truoc khi chay lan sau.
    echo.
  ) else (
    echo [LOI] Thieu file .env va .env.example
    pause
    exit /b 1
  )
)

echo [1/3] Dang tai image tu Docker Hub (lan dau co the mat vai phut)...
docker compose pull
if errorlevel 1 (
  echo [LOI] Khong tai duoc image. Kiem tra mang va thu lai.
  pause
  exit /b 1
)

echo.
echo [2/3] Dang khoi dong AucoBot...
docker compose up -d
if errorlevel 1 (
  echo [LOI] Khoi dong that bai. Xem log trong Docker Desktop ^> Containers ^> aucobot
  pause
  exit /b 1
)

echo.
echo [3/3] Mo trinh duyet...
timeout /t 3 /nobreak >nul
start "" "http://localhost:8386"

echo.
echo  ========================================
echo   San sang! http://localhost:8386
echo   Dang nhap: admin / admin123
echo   ^(doi mat khau trong Cai dat sau khi dang nhap^)
echo.
echo   Quan ly trong Docker Desktop ^> Containers ^> aucobot
echo   Dung AucoBot: chay Dung-AucoBot.bat
echo  ========================================
echo.
timeout /t 2 /nobreak >nul
exit /b 0
