Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Project path
projectPath = "d:\trading2"

' Kill any existing Node processes on port 3000
WshShell.Run "cmd /c for /f ""tokens=5"" %a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %a 2>nul", 0, True

' Wait a bit
WScript.Sleep 500

' Change to project directory and start server
WshShell.CurrentDirectory = projectPath

' Start production server silently
WshShell.Run "cmd /c npm run start", 0, False

' Wait for server to start
WScript.Sleep 4000

' Open Chrome in App Mode
WshShell.Run "chrome --app=http://localhost:3000 --window-size=1400,900", 1, False

' Wait for Chrome to fully load
WScript.Sleep 2000

' Now monitor for Chrome window close and cleanup
' This script will exit but the monitoring continues via Windows Task Scheduler or manual close
