Set WshShell = CreateObject("WScript.Shell")

' Project path
projectPath = "d:\trading2"
port = 3000

' Kill any existing process on port 3000 first
WshShell.Run "cmd /c for /f ""tokens=5"" %%a in ('netstat -ano ^| findstr :" & port & " ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul", 0, True

' Wait a bit
WScript.Sleep 1000

' Start the production server
WshShell.CurrentDirectory = projectPath
WshShell.Run "cmd /c npm run start", 0, False

' Wait for server to be ready (8 seconds should be enough)
WScript.Sleep 8000

' Find Chrome path
chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
If Not CreateObject("Scripting.FileSystemObject").FileExists(chromePath) Then
    chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
End If
If Not CreateObject("Scripting.FileSystemObject").FileExists(chromePath) Then
    chromePath = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Google\Chrome\Application\chrome.exe"
End If

' Open Chrome in App Mode
WshShell.Run """" & chromePath & """ --app=http://localhost:" & port & " --window-size=1400,900", 1, False
