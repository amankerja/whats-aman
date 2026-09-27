@echo off
title WhatsApp Local Hub - Development Mode
color 0E
cls

echo ======================================================
echo       WHATSAPP LOCAL HUB - DEVELOPMENT MODE
echo       Live Hot-Reload: Frontend (Vite) + Backend (TSX)
echo ======================================================
echo.

cd /d "%~dp0"

echo [1/2] Menyiapkan environment development...
echo - Backend API   : http://localhost:3000
echo - Swagger Docs  : http://localhost:3000/api/docs
echo - Frontend Vite : http://localhost:5173 (Hot Module Replacement)
echo.
echo [2/2] Membuka Frontend Vite di Browser...
start "" "http://localhost:5173"

echo.
echo Menjalankan live servers (tekan Ctrl+C untuk stop)...
echo.

call npm run dev
pause
