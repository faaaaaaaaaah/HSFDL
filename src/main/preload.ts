import { contextBridge, ipcRenderer } from 'electron';

export interface DownloadOptions {
  format: 'MP4' | 'MP3' | 'Other';
  quality?: string;
  subtitles?: boolean;
  thumbnail?: boolean;
  embedMetadata?: boolean;
  scheduledTime?: string; // Optional scheduler
}

const api = {
  // Window Controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Settings
  loadSettings: () => ipcRenderer.invoke('settings-load'),
  saveSettings: (settings: any) => ipcRenderer.invoke('settings-save', settings),
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // Downloader Backend
  fetchMetadata: (url: string, cookiesPath?: string) => ipcRenderer.invoke('downloader-fetch-metadata', url, cookiesPath),
  startDownload: (url: string, options: DownloadOptions) => ipcRenderer.invoke('downloader-start', url, options),
  pauseDownload: (id: string) => ipcRenderer.invoke('downloader-pause', id),
  resumeDownload: (id: string) => ipcRenderer.invoke('downloader-resume', id),
  cancelDownload: (id: string) => ipcRenderer.invoke('downloader-cancel', id),
  retryDownload: (id: string) => ipcRenderer.invoke('downloader-retry', id),
  clearQueue: () => ipcRenderer.invoke('downloader-clear-queue'),

  // Listeners
  onDownloadProgress: (callback: (data: any) => void) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('download-progress', subscription);
    return () => ipcRenderer.off('download-progress', subscription);
  },
  onQueueUpdated: (callback: (queue: any[]) => void) => {
    const subscription = (_event: any, queue: any[]) => callback(queue);
    ipcRenderer.on('queue-updated', subscription);
    return () => ipcRenderer.off('queue-updated', subscription);
  },
  onClipboardUrlDetected: (callback: (url: string) => void) => {
    const subscription = (_event: any, url: string) => callback(url);
    ipcRenderer.on('clipboard-url-detected', subscription);
    return () => ipcRenderer.off('clipboard-url-detected', subscription);
  },
  onLogMessage: (callback: (msg: string) => void) => {
    const subscription = (_event: any, msg: string) => callback(msg);
    ipcRenderer.on('log-message', subscription);
    return () => ipcRenderer.off('log-message', subscription);
  },

  // Bug 7: Notify renderer when a download completes so History updates live
  onDownloadCompleted: (callback: (item: any) => void) => {
    const subscription = (_event: any, item: any) => callback(item);
    ipcRenderer.on('download-completed', subscription);
    return () => ipcRenderer.off('download-completed', subscription);
  },
  offDownloadCompleted: (callback: (item: any) => void) => {
    ipcRenderer.removeAllListeners('download-completed');
  },

  // Archive / History
  loadHistory: () => ipcRenderer.invoke('history-load'),
  clearHistory: () => ipcRenderer.invoke('history-clear'),
  openFolder: (dirPath: string) => ipcRenderer.invoke('open-folder', dirPath),
  playFile: (filePath: string) => ipcRenderer.invoke('play-file', filePath),

  // Diagnostics
  checkDependencies: () => ipcRenderer.invoke('diagnostics-check'),
};

contextBridge.exposeInMainWorld('api', api);

declare global {
  interface Window {
    api: typeof api;
  }
}
