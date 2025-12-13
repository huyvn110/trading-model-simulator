Set WshShell = CreateObject("WScript.Shell")

' Kill any node process on port 3000
WshShell.Run "cmd /c for /f ""tokens=5"" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a", 0, True

MsgBox "Trade Tracker stopped!", vbInformation, "Trade Tracker"
