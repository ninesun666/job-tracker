@echo off
chcp 65001 >nul
title Job Tracker - 本地开发模式

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║       Job Tracker - 面试投递记录平台 (开发模式)          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: 进入脚本所在目录
cd /d "%~dp0"

:: 检查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 检查后端依赖
if not exist "backend\node_modules" (
    echo [安装] 正在安装后端依赖...
    cd backend
    call npm install
    cd ..
)

:: 检查前端依赖
if not exist "frontend\node_modules" (
    echo [安装] 正在安装前端依赖...
    cd frontend
    call npm install --legacy-peer-deps
    cd ..
)

:: 检查 .env 文件
if not exist "backend\.env" (
    echo [提示] 创建后端 .env 配置文件...
    (
        echo # Job Tracker 环境配置
        echo PORT=3001
        echo OCR_PROVIDER=qwen
        echo LLM_API_URL=https://coding.dashscope.aliyuncs.com/v1/chat/completions
        echo LLM_API_KEY=your_api_key_here
        echo LLM_MODEL=glm-5
    ) > backend\.env
    echo [注意] 请编辑 backend\.env 文件，填入你的 API Key
    notepad backend\.env
    echo 配置完成后按任意键继续...
    pause >nul
)

echo.
echo ════════════════════════════════════════════════════════════
echo   正在启动服务...
echo ════════════════════════════════════════════════════════════
echo.

:: 启动后端
echo [后端] 启动中... (端口 3001)
start "Job Tracker - Backend" cmd /k "cd /d %~dp0backend && npm run dev"

:: 等待后端启动
timeout /t 3 /nobreak >nul

:: 启动前端
echo [前端] 启动中... (端口 3000)
start "Job Tracker - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: 等待前端启动
timeout /t 5 /nobreak >nul

echo.
echo ════════════════════════════════════════════════════════════
echo.
echo   ✓ 服务已启动！
echo.
echo   前端地址: http://localhost:3000
echo   后端地址: http://localhost:3001
echo.
echo   关闭此窗口不会停止服务
echo   要停止服务，请关闭后端和前端的命令行窗口
echo.
echo ════════════════════════════════════════════════════════════
echo.

:: 自动打开浏览器
start http://localhost:3000

pause
