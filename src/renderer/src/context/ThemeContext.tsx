import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Settings {
  theme: string;
  accentColor: string;
  downloadFolder: string;
  maxConcurrentDownloads: number;
  bandwidthLimit: number;
  ffmpegPath: string;
  proxy: string;
  cookiesPath: string;
  enableAnimations: boolean;
  autoUpdate: boolean;
}

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  format: 'MP4' | 'MP3' | 'Other';
  quality?: string;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  downloadedBytes: string;
  totalBytes: string;
  speed: string;
  eta: string;
  error?: string;
  outputPath?: string;
  addedAt: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface DiagnosticsStatus {
  python: string;
  ytdlp: string;
  ffmpeg: string;
  os: string;
  node: string;
  appVersion: string;
  logsPath: string;
}

interface ThemeContextType {
  theme: string;
  accentColor: string;
  settings: Settings | null;
  queue: DownloadItem[];
  history: DownloadItem[];
  currentView: string;
  diagnostics: DiagnosticsStatus | null;
  logs: string[];
  toasts: ToastMessage[];
  lastClipboardUrl: string;
  setView: (view: string) => void;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  selectFolder: () => Promise<string | null>;
  fetchVideoMetadata: (url: string, cookiesPath?: string) => Promise<any>;
  startDownload: (url: string, options: any) => Promise<void>;
  pauseDownload: (id: string) => Promise<void>;
  resumeDownload: (id: string) => Promise<void>;
  cancelDownload: (id: string) => Promise<void>;
  retryDownload: (id: string) => Promise<void>;
  clearQueue: () => Promise<void>;
  clearHistory: () => Promise<void>;
  openFolder: (dirPath?: string) => Promise<void>;
  playFile: (filePath: string) => Promise<void>;
  runDiagnostics: () => Promise<void>;
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  setLastClipboardUrl: (url: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setView] = useState<string>('downloader');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [queue, setQueue] = useState<DownloadItem[]>([]);
  const [history, setHistory] = useState<DownloadItem[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastClipboardUrl, setLastClipboardUrl] = useState<string>('');

  // Local states matching settings for convenience
  const theme = settings?.theme || 'system';
  const accentColor = settings?.accentColor || '#8a2be2';

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-color', accentColor);
    
    // Hex to RGB conversion for transparent color overlays in CSS
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 138;
    const g = parseInt(hex.substring(2, 4), 16) || 43;
    const b = parseInt(hex.substring(4, 6), 16) || 226;
    root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);

    let activeTheme = theme;
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = systemDark ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', activeTheme);
  }, [theme, accentColor]);

  // Load initial settings, history, diagnostics
  useEffect(() => {
    const init = async () => {
      try {
        const loadedSettings = await window.api.loadSettings();
        setSettings(loadedSettings);

        const loadedHistory = await window.api.loadHistory();
        setHistory(loadedHistory);

        const status = await window.api.checkDependencies();
        setDiagnostics(status);
      } catch (err) {
        console.error('Initialization failed', err);
      }
    };
    init();

    // Listeners from backend
    const unsubscribeProgress = window.api.onDownloadProgress((data) => {
      // Direct updates mapped inside active queue
      setQueue(data);
    });

    const unsubscribeQueue = window.api.onQueueUpdated((updatedQueue) => {
      setQueue(updatedQueue);
    });

    const unsubscribeClipboard = window.api.onClipboardUrlDetected((url) => {
      setLastClipboardUrl(url);
    });

    const unsubscribeLogs = window.api.onLogMessage((msg) => {
      setLogs((prev) => [...prev.slice(-300), msg]); // Keep last 300 logs
    });

    return () => {
      unsubscribeProgress();
      unsubscribeQueue();
      unsubscribeClipboard();
      unsubscribeLogs();
    };
  }, []);

  const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto dismiss after 3 seconds
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!settings) return;
    const merged = { ...settings, ...newSettings };
    const saved = await window.api.saveSettings(merged);
    setSettings(saved);
    addToast('Settings updated successfully.', 'success');
  };

  const selectFolder = async () => {
    const path = await window.api.selectFolder();
    return path;
  };

  const fetchVideoMetadata = async (url: string, customCookiesPath?: string) => {
    try {
      const data = await window.api.fetchMetadata(url, customCookiesPath);
      return data;
    } catch (err: any) {
      addToast(err.message || 'Failed to fetch video details.', 'error');
      throw err;
    }
  };

  const startDownload = async (url: string, options: any) => {
    try {
      await window.api.startDownload(url, options);
      addToast('Download added to queue.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to add download to queue.', 'error');
    }
  };

  const pauseDownload = async (id: string) => {
    await window.api.pauseDownload(id);
    addToast('Download paused.', 'info');
  };

  const resumeDownload = async (id: string) => {
    await window.api.resumeDownload(id);
    addToast('Download resumed.', 'info');
  };

  const cancelDownload = async (id: string) => {
    await window.api.cancelDownload(id);
    addToast('Download cancelled.', 'warning');
  };

  const retryDownload = async (id: string) => {
    await window.api.retryDownload(id);
    addToast('Retrying download...', 'info');
  };

  const clearQueue = async () => {
    const updated = await window.api.clearQueue();
    setQueue(updated);
    addToast('Queue cleared.', 'info');
  };

  const clearHistory = async () => {
    const updated = await window.api.clearHistory();
    setHistory(updated);
    addToast('History cleared.', 'warning');
  };

  const openFolder = async (dirPath?: string) => {
    await window.api.openFolder(dirPath || '');
  };

  const playFile = async (filePath: string) => {
    await window.api.playFile(filePath);
  };

  const runDiagnostics = async () => {
    const status = await window.api.checkDependencies();
    setDiagnostics(status);
    addToast('Environment diagnostics complete.', 'success');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accentColor,
        settings,
        queue,
        history,
        currentView,
        diagnostics,
        logs,
        toasts,
        lastClipboardUrl,
        setView,
        updateSettings,
        selectFolder,
        fetchVideoMetadata,
        startDownload,
        pauseDownload,
        resumeDownload,
        cancelDownload,
        retryDownload,
        clearQueue,
        clearHistory,
        openFolder,
        playFile,
        runDiagnostics,
        addToast,
        removeToast,
        setLastClipboardUrl,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within a ThemeProvider');
  return context;
};
