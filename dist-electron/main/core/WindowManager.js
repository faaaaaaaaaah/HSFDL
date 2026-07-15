"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowManager = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
class WindowManager {
    static createWindow() {
        this.mainWindow = new electron_1.BrowserWindow({
            width: 1024,
            height: 768,
            minWidth: 800,
            minHeight: 600,
            show: false,
            frame: false, // Frameless window for custom titlebar
            titleBarStyle: 'hidden',
            titleBarOverlay: false, // We will handle our own controls
            transparent: false,
            backgroundColor: '#1c1c1e', // Dark mode by default
            webPreferences: {
                preload: path_1.default.join(__dirname, 'preload.js'),
                sandbox: true,
                contextIsolation: true,
                nodeIntegration: false,
            },
        });
        this.mainWindow.on('ready-to-show', () => {
            this.mainWindow?.show();
        });
        this.mainWindow.webContents.setWindowOpenHandler((details) => {
            electron_1.shell.openExternal(details.url);
            return { action: 'deny' };
        });
        if (!electron_1.app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
            this.mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
        }
        else {
            this.mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
        }
        this.setupWindowIpc();
    }
    static setupWindowIpc() {
        electron_1.ipcMain.on('window:minimize', () => {
            this.mainWindow?.minimize();
        });
        electron_1.ipcMain.on('window:maximize', () => {
            if (this.mainWindow?.isMaximized()) {
                this.mainWindow?.unmaximize();
            }
            else {
                this.mainWindow?.maximize();
            }
        });
        electron_1.ipcMain.on('window:close', () => {
            this.mainWindow?.close();
        });
    }
}
exports.WindowManager = WindowManager;
WindowManager.mainWindow = null;
//# sourceMappingURL=WindowManager.js.map