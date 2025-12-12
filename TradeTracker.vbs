Set WshShell = CreateObject("WScript.Shell")

' Run the PowerShell script hidden (no window)
WshShell.Run "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File ""d:\trading2\TradeTracker.ps1""", 0, False
