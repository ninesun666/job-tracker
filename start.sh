#!/bin/bash
echo Starting Job Tracker...

# Start backend
osascript -e 'tell application "Terminal" to do script "cd '$(pwd)'/backend && npm install && npm run dev"'

# Wait for backend to start
sleep 3

# Start frontend
osascript -e 'tell application "Terminal" to do script "cd '$(pwd)'/frontend && npm install && npm run dev"'

echo Job Tracker started!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000