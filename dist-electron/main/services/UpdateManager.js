"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateManager = void 0;
const electron_updater_1 = require("electron-updater");
const Logger_1 = require("../utils/Logger");
class UpdateManager {
    static initialize() {
        electron_updater_1.autoUpdater.logger = Logger_1.Logger.updater;
        electron_updater_1.autoUpdater.autoDownload = false;
        electron_updater_1.autoUpdater.autoInstallOnAppQuit = true;
        electron_updater_1.autoUpdater.on('checking-for-update', () => {
            Logger_1.Logger.updater.info('Checking for update...');
        });
        electron_updater_1.autoUpdater.on('update-available', (info) => {
            Logger_1.Logger.updater.info('Update available.', info);
            // Could notify UI here
            electron_updater_1.autoUpdater.downloadUpdate();
        });
        electron_updater_1.autoUpdater.on('update-not-available', (info) => {
            Logger_1.Logger.updater.info('Update not available.', info);
        });
        electron_updater_1.autoUpdater.on('error', (err) => {
            Logger_1.Logger.updater.error('Error in auto-updater. ' + err);
        });
        electron_updater_1.autoUpdater.on('download-progress', (progressObj) => {
            let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
            log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
            log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
            Logger_1.Logger.updater.info(log_message);
        });
        electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
            Logger_1.Logger.updater.info('Update downloaded', info);
            // In a real app, we'd prompt the user, but for now we could just quit and install
            // autoUpdater.quitAndInstall();
        });
    }
    static checkForUpdates() {
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    }
}
exports.UpdateManager = UpdateManager;
//# sourceMappingURL=UpdateManager.js.map