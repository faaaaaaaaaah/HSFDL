"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const WindowManager_1 = require("./core/WindowManager");
const Logger_1 = require("./utils/Logger");
const SettingsManager_1 = require("./services/SettingsManager");
const BinaryManager_1 = require("./services/BinaryManager");
const DownloadEngine_1 = require("./services/DownloadEngine");
const UpdateManager_1 = require("./services/UpdateManager");
// Prevent multiple instances
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        if (WindowManager_1.WindowManager.mainWindow) {
            if (WindowManager_1.WindowManager.mainWindow.isMinimized())
                WindowManager_1.WindowManager.mainWindow.restore();
            WindowManager_1.WindowManager.mainWindow.focus();
        }
    });
    electron_1.app.whenReady().then(() => {
        // 1. Initialize Logger
        Logger_1.Logger.initialize();
        Logger_1.Logger.app.info('Application starting...');
        // 2. Initialize Settings
        SettingsManager_1.SettingsManager.initialize();
        // 3. Verify Binaries
        BinaryManager_1.BinaryManager.initialize();
        // 4. Initialize Auto Updater
        UpdateManager_1.UpdateManager.initialize();
        if (SettingsManager_1.SettingsManager.getSettings().autoUpdate) {
            UpdateManager_1.UpdateManager.checkForUpdates();
        }
        // 5. Create Window
        WindowManager_1.WindowManager.createWindow();
        electron_1.app.on('activate', () => {
            if (WindowManager_1.WindowManager.mainWindow === null) {
                WindowManager_1.WindowManager.createWindow();
            }
        });
    });
    electron_1.app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            electron_1.app.quit();
        }
    });
    // Setup IPC Routing
    electron_1.ipcMain.handle('settings:get', () => {
        return SettingsManager_1.SettingsManager.getSettings();
    });
    electron_1.ipcMain.handle('settings:set', (_event, settings) => {
        SettingsManager_1.SettingsManager.saveSettings(settings);
        return SettingsManager_1.SettingsManager.getSettings();
    });
    electron_1.ipcMain.handle('downloads:fetchMetadata', async (_event, url) => {
        try {
            return await DownloadEngine_1.DownloadEngine.fetchMetadata(url);
        }
        catch (e) {
            Logger_1.Logger.error.error('Metadata fetch failed:', e);
            throw e;
        }
    });
    electron_1.ipcMain.handle('downloads:start', (_event, item) => {
        DownloadEngine_1.DownloadEngine.startDownload(item, (updatedItem) => {
            WindowManager_1.WindowManager.mainWindow?.webContents.send('downloads:progress', updatedItem);
        });
    });
    electron_1.ipcMain.handle('downloads:cancel', (_event, id) => {
        DownloadEngine_1.DownloadEngine.cancelDownload(id);
    });
}
//# sourceMappingURL=index.js.map