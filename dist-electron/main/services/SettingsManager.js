"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const Logger_1 = require("../utils/Logger");
class SettingsManager {
    static initialize() {
        this.settingsPath = path_1.default.join(electron_1.app.getPath('userData'), 'settings.json');
        this.loadSettings();
    }
    static getDefaultSettings() {
        return {
            theme: 'system',
            downloadPath: path_1.default.join(electron_1.app.getPath('downloads'), 'HSFDL'),
            concurrentDownloads: 3,
            bandwidthLimit: 0,
            autoUpdate: true,
            developerMode: false,
        };
    }
    static loadSettings() {
        if (fs_1.default.existsSync(this.settingsPath)) {
            try {
                const data = fs_1.default.readFileSync(this.settingsPath, 'utf-8');
                const parsed = JSON.parse(data);
                this.currentSettings = { ...this.getDefaultSettings(), ...parsed };
            }
            catch (error) {
                Logger_1.Logger.error.error('Failed to parse settings.json, reverting to defaults', error);
                this.currentSettings = this.getDefaultSettings();
            }
        }
        else {
            this.currentSettings = this.getDefaultSettings();
            this.saveSettings(this.currentSettings);
        }
    }
    static getSettings() {
        return this.currentSettings;
    }
    static saveSettings(newSettings) {
        this.currentSettings = { ...this.currentSettings, ...newSettings };
        try {
            fs_1.default.writeFileSync(this.settingsPath, JSON.stringify(this.currentSettings, null, 2));
            Logger_1.Logger.app.info('Settings saved successfully.');
        }
        catch (error) {
            Logger_1.Logger.error.error('Failed to save settings.json', error);
        }
    }
}
exports.SettingsManager = SettingsManager;
//# sourceMappingURL=SettingsManager.js.map