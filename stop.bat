@echo off
chcp 65001 >nul
title Job Tracker - 停止服务

echo.
echo ════════════════════════════════════════════════════════════
echo   Job Tracker - 停止所有服务
echo ════════════════════════════════════════════════════════════
echo.

:: 停止 Docker 容器
cd /d "%~dp0"
docker-compose down 2>nul
if %errorlevel% equ 0 (
    echo [Docker] 容器已停止
)

:: 停止本地开发进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001.*LISTENING"') do (
    echo [后端] 停止进程 %%a
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
    echo [前端] 停止进程 %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo ✓ 所有服务已停止
echo.
pause
