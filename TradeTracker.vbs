Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "d:\trading2"

' Start server HIDDEN (no terminal window)
WshShell.Run "cmd /c npm run dev", 0, False

' Wait 6 seconds for server to fully start
WScript.Sleep 6000

' Open Chrome in App Mode
WshShell.Run "chrome --app=http://localhost:3000", 0, False
