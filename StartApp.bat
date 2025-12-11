@echo off
cd /d "d:\trading2"
echo Starting Trading Model Simulator...
echo.
echo App will open at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
start http://localhost:3000
npm run start
