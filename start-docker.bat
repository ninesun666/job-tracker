@echo off
chcp 65001 >nul
title Job Tracker - 面试投递记录平台

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║       Job Tracker - 面试投递记录平台                      ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: 检查 Docker 是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Docker，请先安装 Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

:: 检查 Docker 是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] Docker 未运行，正在启动...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo 等待 Docker 启动...
    timeout /t 30 /nobreak >nul
)

:: 进入脚本所在目录
cd /d "%~dp0"

:: 检查 .env 文件
if not exist .env (
    echo [提示] 创建 .env 配置文件...
    (
        echo # Job Tracker 环境配置
        echo LLM_API_URL=https://coding.dashscope.aliyuncs.com/v1/chat/completions
        echo LLM_API_KEY=your_api_key_here
        echo LLM_MODEL=glm-5
    ) > .env
    echo [注意] 请编辑 .env 文件，填入你的 API Key
    notepad .env
    echo 配置完成后按任意键继续...
    pause >nul
)

:: 检查容器是否已存在
docker ps -a --filter "name=job-tracker" --format "{{.Names}}" | findstr "job-tracker" >nul
if %errorlevel% equ 0 (
    echo [提示] 检测到已有容器，正在重启...
    docker restart job-tracker
    goto :show_url
)

:: 构建并启动
echo [构建] 正在构建 Docker 镜像...
docker-compose build

echo [启动] 正在启动服务...
docker-compose up -d

:show_url
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo   ✓ 服务已启动！
echo.
echo   访问地址: http://localhost:3001
echo.
echo   停止服务: docker-compose down
echo   查看日志: docker-compose logs -f
echo.
echo ════════════════════════════════════════════════════════════
echo.

:: 自动打开浏览器
timeout /t 3 /nobreak >nul
start http://localhost:3001

pause
