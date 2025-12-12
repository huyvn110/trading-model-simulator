// Test electron require
console.log('Testing Electron...');

try {
    const electron = require('electron');
    console.log('Electron object:', electron);
    console.log('Electron keys:', Object.keys(electron));
    console.log('app:', electron.app);
    console.log('BrowserWindow:', electron.BrowserWindow);
} catch (err) {
    console.error('Error requiring electron:', err);
}
