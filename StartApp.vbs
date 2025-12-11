' Trade Tracker - Silent Launcher
' Double-click this file to start the app without showing terminal

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "d:\trading2"

' Start the server in background (hidden)
WshShell.Run "cmd /c npm run dev", 0, False

' Wait 3 seconds for server to start
WScript.Sleep 3000

' Open browser
WshShell.Run "http://localhost:3000", 1, False

MsgBox "Trade Tracker đang chạy!" & vbCrLf & vbCrLf & _
       "Truy cập: http://localhost:3000" & vbCrLf & vbCrLf & _
       "Để tắt ứng dụng, chạy file StopApp.vbs", vbInformation, "Trade Tracker"
