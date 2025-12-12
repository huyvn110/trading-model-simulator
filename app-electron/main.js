// Simple Electron main file - loads local server
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: 'Trade Tracker',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true,
    });

    // Load after server starts
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:3000');
    }, 3000);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startServer() {
    const isWindows = process.platform === 'win32';
    const npmCmd = isWindows ? 'npm.cmd' : 'npm';

    serverProcess = spawn(npmCmd, ['run', 'start'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        shell: false
    });
}

app.on('ready', () => {
    startServer();
    createWindow();
});

app.on('window-all-closed', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
    app.quit();
});
