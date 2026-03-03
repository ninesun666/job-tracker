@echo off
echo Starting Job Tracker...

:: Start backend
start cmd /k "cd /d %~dp0backend && npm install && npm run dev"

:: Wait for backend to start
timeout /t 3 /nobreak > nul

:: Start frontend
start cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

echo Job Tracker started!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
pause