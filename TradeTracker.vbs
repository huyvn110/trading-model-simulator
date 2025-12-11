Set WshShell = CreateObject("WScript.Shell")

' Kill any existing Node processes first
WshShell.Run "cmd /c taskkill /F /IM node.exe 2>nul", 0, True

' Wait a bit for processes to terminate
WScript.Sleep 1000

' Change to project directory
WshShell.CurrentDirectory = "d:\trading2"

' Start PRODUCTION server (much faster than dev mode!)
WshShell.Run "cmd /c npm run start", 0, False

' Wait only 3 seconds (production starts faster)
WScript.Sleep 3000

' Open Chrome in App Mode
WshShell.Run "chrome --app=http://localhost:3000", 0, False
