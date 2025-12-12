# TradeTracker App Runner
# This script starts the app and closes the server when Chrome is closed

$projectPath = "d:\trading2"
$port = 3000

# Kill any existing process on port 3000
$existingPid = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1
if ($existingPid) {
    Stop-Process -Id $existingPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Start the production server in background
$serverProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run start" -WorkingDirectory $projectPath -WindowStyle Hidden -PassThru

# Wait for server to start
Start-Sleep -Seconds 3

# Open Chrome in App Mode and get the process
$chromeProcess = Start-Process -FilePath "chrome" -ArgumentList "--app=http://localhost:$port" -PassThru

# Wait for Chrome to close
$chromeProcess.WaitForExit()

# When Chrome closes, kill the Node server
$nodePid = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1
if ($nodePid) {
    Stop-Process -Id $nodePid -Force -ErrorAction SilentlyContinue
}

# Also kill any leftover node processes from our server
if ($serverProcess -and !$serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}
