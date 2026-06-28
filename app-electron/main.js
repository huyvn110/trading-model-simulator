// Electron Main Process - Trade Tracker Desktop App
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let splashWindow;
let serverProcess;
let tray;

const APP_PORT = 3000;
const APP_URL = `http://localhost:${APP_PORT}`;

// ============================================================
// 1. Splash Screen - Hiện logo trong lúc chờ server
// ============================================================
function createSplashWindow() {
    const brandMarkPath = path.join(__dirname, '..', 'public', 'brand-mark.svg');
    const brandMarkSvg = fs.readFileSync(brandMarkPath, 'utf8');

    splashWindow = new BrowserWindow({
        width: 420,
        height: 280,
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Dùng SVG cục bộ để logo luôn hiện trước khi Next.js server sẵn sàng.
    const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                color: #f8f5ed;
                background:
                    radial-gradient(circle at 50% 22%, rgba(214, 179, 106, 0.11), transparent 42%),
                    #111315;
                border: 1px solid rgba(214, 179, 106, 0.18);
                border-radius: 18px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                overflow: hidden;
                position: relative;
            }
            body::after {
                content: '';
                position: absolute;
                inset: 9px;
                border: 1px solid rgba(255, 255, 255, 0.035);
                border-radius: 12px;
                pointer-events: none;
            }
            .content-wrapper {
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                animation: reveal 560ms cubic-bezier(.2,.8,.2,1) both;
            }
            .logo-container {
                position: relative;
                width: 72px;
                height: 72px;
                margin-bottom: 20px;
            }
            .logo-glow {
                position: absolute;
                inset: 8px;
                background: rgba(214, 179, 106, 0.34);
                filter: blur(24px);
                border-radius: 18px;
                animation: breathe 2.4s ease-in-out infinite;
            }
            .brand-mark {
                position: relative;
                width: 100%;
                height: 100%;
                border-radius: 16px;
                box-shadow: 0 12px 34px rgba(0, 0, 0, 0.42);
                z-index: 2;
            }
            .brand-mark svg {
                display: block;
                width: 100%;
                height: 100%;
            }
            .title {
                color: #f8f5ed;
                font-size: 22px;
                font-weight: 650;
                letter-spacing: -0.35px;
                margin-bottom: 8px;
            }
            .subtitle {
                color: #8d8f92;
                font-size: 10px;
                font-weight: 600;
                margin-bottom: 27px;
                letter-spacing: 2.4px;
                text-transform: uppercase;
            }
            .loading-track {
                width: 132px;
                height: 2px;
                background: rgba(255, 255, 255, 0.065);
                border-radius: 99px;
                position: relative;
                overflow: hidden;
            }
            .loading-bar {
                position: absolute;
                inset: 0 auto 0 0;
                height: 100%;
                width: 42%;
                background: linear-gradient(90deg, transparent, #d6b36a, transparent);
                animation: sweep 1.5s infinite cubic-bezier(.4,0,.2,1);
                border-radius: 99px;
            }
            @keyframes reveal {
                from { opacity: 0; transform: translateY(6px) scale(0.985); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes breathe {
                0%, 100% { opacity: 0.45; transform: scale(0.92); }
                50% { opacity: 0.72; transform: scale(1.08); }
            }
            @keyframes sweep {
                0% { transform: translateX(-115%); }
                100% { transform: translateX(350%); }
            }
            @media (prefers-reduced-motion: reduce) {
                .content-wrapper, .logo-glow, .loading-bar { animation: none; }
            }
        </style>
    </head>
    <body>
        <div class="content-wrapper">
            <div class="logo-container">
                <div class="logo-glow"></div>
                <div class="brand-mark">${brandMarkSvg}</div>
            </div>
            <div class="title">Trade Tracker</div>
            <div class="subtitle">Nhật ký giao dịch</div>
            <div class="loading-track">
                <div class="loading-bar"></div>
            </div>
        </div>
    </body>
    </html>`;

    splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
}

// ============================================================
// 2. Main Window - Cửa sổ chính
// ============================================================
function createMainWindow() {
    const iconPath = path.join(__dirname, '..', 'public', 'logo.png');

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        show: false, // Ẩn cho đến khi server sẵn sàng
        frame: false, // Ẩn thanh tiêu đề Windows mặc định
        titleBarStyle: 'hidden',
        icon: iconPath,
        title: 'Trade Tracker',
        backgroundColor: '#0f172a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        autoHideMenuBar: true,
    });

    // Gửi sự kiện maximize/unmaximize sang React
    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('window-maximized');
    });
    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('window-unmaximized');
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ============================================================
// 3. Server - Chờ Next.js server sẵn sàng
// ============================================================
function startServer() {
    const isWindows = process.platform === 'win32';
    const npmCmd = isWindows ? 'npm.cmd' : 'npm';

    serverProcess = spawn(npmCmd, ['run', 'start'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        shell: false,
    });

    serverProcess.stdout.on('data', (data) => {
        console.log(`[Server] ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(`[Server Error] ${data}`);
    });
}

function waitForServer(url, timeout = 30000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const check = () => {
            http.get(url, (res) => {
                if (res.statusCode === 200 || res.statusCode === 304) {
                    resolve();
                } else {
                    retry();
                }
            }).on('error', () => {
                retry();
            });
        };

        const retry = () => {
            if (Date.now() - startTime > timeout) {
                reject(new Error('Server startup timeout'));
                return;
            }
            setTimeout(check, 500);
        };

        check();
    });
}

// ============================================================
// 4. Tray Icon - Icon ở thanh Taskbar
// ============================================================
function createTray() {
    const iconPath = path.join(__dirname, '..', 'public', 'logo.png');
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Mở Trade Tracker',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
        },
        { type: 'separator' },
        {
            label: 'Thoát',
            click: () => {
                app.quit();
            },
        },
    ]);

    tray.setToolTip('Trade Tracker');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// ============================================================
// 5. IPC Handlers - Xử lý lệnh từ React
// ============================================================
function setupIPC() {
    ipcMain.on('window-minimize', () => {
        if (mainWindow) mainWindow.minimize();
    });

    ipcMain.on('window-maximize', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
        }
    });

    ipcMain.on('window-close', () => {
        if (mainWindow) mainWindow.close();
    });

    ipcMain.handle('window-is-maximized', () => {
        return mainWindow ? mainWindow.isMaximized() : false;
    });
}

// ============================================================
// 6. App Lifecycle
// ============================================================
app.on('ready', async () => {
    setupIPC();
    createSplashWindow();
    createMainWindow();
    createTray();
    startServer();

    try {
        await waitForServer(APP_URL);

        // Server sẵn sàng → Load trang chính
        mainWindow.loadURL(APP_URL);

        mainWindow.webContents.on('did-finish-load', () => {
            // Đóng splash, hiện cửa sổ chính
            if (splashWindow) {
                splashWindow.close();
                splashWindow = null;
            }
            mainWindow.show();
            mainWindow.focus();
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        if (splashWindow) splashWindow.close();
        app.quit();
    }
});

app.on('window-all-closed', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
    if (tray) {
        tray.destroy();
    }
    app.quit();
});

app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
