@echo off
cd /d D:\trading2
echo Starting Trade Tracker server on port 3000...
npm.cmd run start >> .next-dev.log 2>> .next-dev.err.log
echo.
echo Server stopped. Check .next-dev.log and .next-dev.err.log for details.
pause
