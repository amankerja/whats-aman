@echo off
title WhatsApp Local Hub - Portable Platform
color 0B
cls

echo ======================================================
echo            WHATSAPP LOCAL HUB (PORTABLE)
echo       WhatsApp Automation ^& Management Platform
echo ======================================================
echo.

cd /d "%~dp0"

:: Check if native Desktop EXE exists
if exist "WhatsAppLocalHub.exe" (
    echo [OK] Menjalankan Aplikasi Desktop Asli Windows...
    start "" "WhatsAppLocalHub.exe"
    exit
)

:: Fallback if EXE not compiled yet
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js tidak ditemukan di sistem Windows ini!
    echo.
    pause
    exit /b 1
)

if not exist "dist\index.js" (
    echo [INFO] Mengompilasi proyek TypeScript...
    call npm run build
)

echo [OK] Menjalankan Server Core di http://127.0.0.1:3000...
start "" "http://127.0.0.1:3000"
node dist/index.js
pause
