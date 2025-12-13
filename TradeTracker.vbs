Set WshShell = CreateObject("WScript.Shell")

' Run the PowerShell script hidden (no terminal window)
WshShell.Run "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File ""d:\trading2\TradeTracker.ps1""", 0, False
