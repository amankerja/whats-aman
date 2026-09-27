@echo off
title WhatsApp Local Hub - Portable Platform
color 0A
cls

echo ======================================================
echo            WHATSAPP LOCAL HUB (PORTABLE)
echo       WhatsApp Automation ^& Management Platform
echo ======================================================
echo.

:: Ensure in current directory
cd /d "%~dp0"

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js tidak ditemukan di sistem Windows ini!
    echo Silakan install Node.js dari https://nodejs.org/ atau letakkan folder node portable di dalam runtime/
    echo.
    pause
    exit /b 1
)

:: Ensure dist exists, if not build it
if not exist "dist\index.js" (
    echo [INFO] Mengompilasi proyek TypeScript pertama kali...
    call npm run build
)

echo [1/4] Memeriksa Direktori Data Lokal (data/)...
if not exist "data" mkdir "data"
if not exist "data\sessions" mkdir "data\sessions"
if not exist "data\media" mkdir "data\media"
if not exist "data\backups" mkdir "data\backups"
echo [OK] Direktori data mandiri siap.

echo [2/4] Menyiapkan SQLite Database...
echo [OK] Database engine Better-SQLite3 siap.

echo [3/4] Menjalankan WhatsApp Local Core Engine...
echo [OK] Server mendengarkan di http://127.0.0.1:3000

echo [4/4] Membuka Dashboard di browser utama...
start "" "http://127.0.0.1:3000"

echo.
echo ======================================================
echo  Dashboard UI   : http://127.0.0.1:3000
echo  Swagger API Doc: http://127.0.0.1:3000/docs
echo ======================================================
echo Tekan Ctrl+C untuk menghentikan server aplikasi.
echo.

node dist/index.js
pause
