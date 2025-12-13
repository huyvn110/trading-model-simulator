# Trade Tracker Desktop App Launcher
# Opens app and closes server when Chrome window is closed

$projectPath = "d:\trading2"
$port = 3000

Write-Host "Starting Trade Tracker..."

# Kill any existing process on port 3000
try {
    $existingConnections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($existingConnections) {
        foreach ($conn in $existingConnections) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    }
}
catch {
    Write-Host "No existing server to stop"
}

# Start the production server in background
Write-Host "Starting server..."
$serverProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start" -WorkingDirectory $projectPath -WindowStyle Hidden -PassThru

# Wait for server to start (check if port is listening)
Write-Host "Waiting for server..."
$maxWait = 60
$waited = 0
$serverReady = $false

while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 1
    $waited++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "Server ready after $waited seconds"
            break
        }
    }
    catch {
        Write-Host "Waiting... ($waited s)"
    }
}

if (-not $serverReady) {
    Write-Host "Warning: Server may not be fully ready, opening anyway..."
}

# Find Chrome path
$chromePath = $null
$chromePaths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $chromePath = $path
        break
    }
}

if (-not $chromePath) {
    Write-Host "Chrome not found! Using default browser..."
    Start-Process "http://localhost:$port"
    exit
}

# Start Chrome in app mode and wait for it to close
Write-Host "Opening app..."
$chromeProcess = Start-Process -FilePath $chromePath -ArgumentList "--app=http://localhost:$port", "--window-size=1400,900" -PassThru

# Wait for Chrome to close
$chromeProcess.WaitForExit()

# When Chrome closes, kill the server
Write-Host "App closed, stopping server..."
try {
    $serverConnections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($serverConnections) {
        foreach ($conn in $serverConnections) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}
catch {}

# Kill the server process we started
if ($serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}

Write-Host "Done!"
