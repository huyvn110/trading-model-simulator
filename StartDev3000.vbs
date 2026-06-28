Set WshShell = CreateObject("WScript.Shell")

projectPath = "D:\trading2"
port = 3000

WshShell.Run "cmd /c for /f ""tokens=5"" %%a in ('netstat -ano ^| findstr :" & port & " ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul", 0, True
WScript.Sleep 1500

WshShell.CurrentDirectory = projectPath
WshShell.Run "cmd /c start ""TradeTracker Dev 3000"" /min """ & projectPath & "\StartDev3000.bat""", 1, False
