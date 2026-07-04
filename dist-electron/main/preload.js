"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    // Window Controls
    minimize: () => electron_1.ipcRenderer.send('window-minimize'),
    maximize: () => electron_1.ipcRenderer.send('window-maximize'),
    close: () => electron_1.ipcRenderer.send('window-close'),
    // Settings
    loadSettings: () => electron_1.ipcRenderer.invoke('settings-load'),
    saveSettings: (settings) => electron_1.ipcRenderer.invoke('settings-save', settings),
    selectFolder: () => electron_1.ipcRenderer.invoke('select-folder'),
    // Downloader Backend
    fetchMetadata: (url, cookiesPath) => electron_1.ipcRenderer.invoke('downloader-fetch-metadata', url, cookiesPath),
    startDownload: (url, options) => electron_1.ipcRenderer.invoke('downloader-start', url, options),
    pauseDownload: (id) => electron_1.ipcRenderer.invoke('downloader-pause', id),
    resumeDownload: (id) => electron_1.ipcRenderer.invoke('downloader-resume', id),
    cancelDownload: (id) => electron_1.ipcRenderer.invoke('downloader-cancel', id),
    retryDownload: (id) => electron_1.ipcRenderer.invoke('downloader-retry', id),
    clearQueue: () => electron_1.ipcRenderer.invoke('downloader-clear-queue'),
    // Listeners
    onDownloadProgress: (callback) => {
        const subscription = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('download-progress', subscription);
        return () => electron_1.ipcRenderer.off('download-progress', subscription);
    },
    onQueueUpdated: (callback) => {
        const subscription = (_event, queue) => callback(queue);
        electron_1.ipcRenderer.on('queue-updated', subscription);
        return () => electron_1.ipcRenderer.off('queue-updated', subscription);
    },
    onClipboardUrlDetected: (callback) => {
        const subscription = (_event, url) => callback(url);
        electron_1.ipcRenderer.on('clipboard-url-detected', subscription);
        return () => electron_1.ipcRenderer.off('clipboard-url-detected', subscription);
    },
    onLogMessage: (callback) => {
        const subscription = (_event, msg) => callback(msg);
        electron_1.ipcRenderer.on('log-message', subscription);
        return () => electron_1.ipcRenderer.off('log-message', subscription);
    },
    // Archive / History
    loadHistory: () => electron_1.ipcRenderer.invoke('history-load'),
    clearHistory: () => electron_1.ipcRenderer.invoke('history-clear'),
    openFolder: (dirPath) => electron_1.ipcRenderer.invoke('open-folder', dirPath),
    playFile: (filePath) => electron_1.ipcRenderer.invoke('play-file', filePath),
    // Diagnostics
    checkDependencies: () => electron_1.ipcRenderer.invoke('diagnostics-check'),
};
electron_1.contextBridge.exposeInMainWorld('api', api);
