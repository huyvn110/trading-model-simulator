' Trade Tracker - Stop Server
' Double-click this file to stop the running server

Set WshShell = CreateObject("WScript.Shell")

' Kill Node.js processes running on port 3000
WshShell.Run "cmd /c taskkill /F /IM node.exe", 0, True

MsgBox "Đã tắt Trade Tracker!", vbInformation, "Trade Tracker"
