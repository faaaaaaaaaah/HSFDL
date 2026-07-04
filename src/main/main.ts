import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, exec } from 'child_process';

let mainWindow: BrowserWindow | null = null;
const userDataPath = app.getPath('userData');
const settingsFilePath = path.join(userDataPath, 'settings.json');
const historyFilePath = path.join(userDataPath, 'history.json');
const logsFilePath = path.join(userDataPath, 'hsfdl_logs.txt');

// Logging helper
function appendLog(msg: string) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] ${msg}\n`;
  try {
    fs.appendFileSync(logsFilePath, formatted);
    if (mainWindow) {
      mainWindow.webContents.send('log-message', formatted.trim());
    }
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}

// Initial default settings
let appSettings = {
  theme: 'system', // 'light' | 'dark' | 'system'
  accentColor: '#8a2be2', // Royal Purple default
  downloadFolder: app.getPath('downloads') || path.join(process.env.USERPROFILE || '', 'Downloads'),
  maxConcurrentDownloads: 2,
  bandwidthLimit: 0, // 0 = unlimited, in KB/s
  ffmpegPath: '',
  proxy: '',
  cookiesPath: '',
  enableAnimations: true,
  autoUpdate: true,
};

// Load settings
function loadSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const data = fs.readFileSync(settingsFilePath, 'utf-8');
      appSettings = { ...appSettings, ...JSON.parse(data) };
    }
  } catch (err) {
    appendLog(`Error loading settings: ${err}`);
  }
  return appSettings;
}

// Save settings
function saveSettings(newSettings: any) {
  try {
    appSettings = { ...appSettings, ...newSettings };
    fs.writeFileSync(settingsFilePath, JSON.stringify(appSettings, null, 2), 'utf-8');
    appendLog('Settings saved successfully.');
  } catch (err) {
    appendLog(`Error saving settings: ${err}`);
  }
  return appSettings;
}

// Load/Save download history
function loadHistory() {
  try {
    if (fs.existsSync(historyFilePath)) {
      return JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'));
    }
  } catch (err) {
    appendLog(`Error loading history: ${err}`);
  }
  return [];
}

function addToHistory(item: any) {
  try {
    const history = loadHistory();
    history.unshift({
      ...item,
      completedAt: new Date().toISOString(),
    });
    // Keep last 100 entries
    if (history.length > 100) history.pop();
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), 'utf-8');
  } catch (err) {
    appendLog(`Error saving history item: ${err}`);
  }
}

// Detect command base for yt-dlp
let ytDlpCommandBase: string[] = [];

function checkDependency(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(cmd, (error) => {
      resolve(!error);
    });
  });
}

async function detectDependencies() {
  appendLog('Detecting dependencies...');

  // Try direct standalone yt-dlp
  const hasYtDlp = await checkDependency('yt-dlp --version');
  if (hasYtDlp) {
    ytDlpCommandBase = ['yt-dlp'];
    appendLog('Detected standalone yt-dlp.');
  } else {
    // Try via python
    const hasPythonYtDlp = await checkDependency('python -m yt_dlp --version');
    if (hasPythonYtDlp) {
      ytDlpCommandBase = ['python', '-m', 'yt_dlp'];
      appendLog('Detected yt-dlp installed in Python module.');
    } else {
      appendLog('yt-dlp NOT detected on system. Downloads will fail unless yt-dlp is installed.');
    }
  }

  const hasFfmpeg = await checkDependency(appSettings.ffmpegPath ? `"${appSettings.ffmpegPath}" -version` : 'ffmpeg -version');
  appendLog(`FFmpeg status: ${hasFfmpeg ? 'Found' : 'Not Found'}`);
}

// Fetch Metadata
async function fetchMetadata(videoUrl: string, customCookiesPath?: string) {
  return new Promise((resolve, reject) => {
    if (ytDlpCommandBase.length === 0) {
      return reject(new Error('yt-dlp is not installed or detected on your system. Please configure it in Settings/Diagnostics.'));
    }

    appendLog(`Fetching metadata for URL: ${videoUrl}`);
    const args = [...ytDlpCommandBase.slice(1), '--dump-json', '--no-playlist', videoUrl];
    const cmd = ytDlpCommandBase[0];

    const cookiesToUse = customCookiesPath || appSettings.cookiesPath;
    if (cookiesToUse && fs.existsSync(cookiesToUse)) {
      args.push('--cookies', cookiesToUse);
    }

    if (appSettings.proxy) {
      args.push('--proxy', appSettings.proxy);
    }

    const process = spawn(cmd, args, { shell: true });
    let stdoutData = '';
    let stderrData = '';

    process.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        appendLog(`Metadata fetch failed with code ${code}. Error: ${stderrData}`);
        return reject(new Error(stderrData || `Failed to fetch metadata (exit code ${code})`));
      }

      try {
        const rawJson = JSON.parse(stdoutData.trim());

        // Extract available formats & qualities
        const formats = (rawJson.formats || []).map((f: any) => {
          let resolution = 'N/A';
          if (f.resolution) {
            resolution = f.resolution;
          } else if (f.height) {
            resolution = `${f.height}p`;
          } else if (f.vcodec !== 'none') {
            resolution = `${f.height || ''}p`;
          }

          let size = 'Unknown size';
          if (f.filesize) {
            size = `${(f.filesize / (1024 * 1024)).toFixed(1)} MB`;
          } else if (f.filesize_approx) {
            size = `~${(f.filesize_approx / (1024 * 1024)).toFixed(1)} MB`;
          }

          return {
            formatId: f.format_id,
            ext: f.ext,
            resolution,
            note: f.format_note || f.acodec || '',
            size,
            fps: f.fps || null,
            vcodec: f.vcodec || 'none',
            acodec: f.acodec || 'none',
          };
        });

        // Filter unique formats that are useful
        const uniqueFormats = formats.filter((f: any) => f.vcodec !== 'none' || f.acodec !== 'none');

        const metadata = {
          title: rawJson.title || 'Unknown Title',
          uploader: rawJson.uploader || 'Unknown Uploader',
          duration: rawJson.duration || 0,
          viewCount: rawJson.view_count || 0,
          thumbnail: rawJson.thumbnail || (rawJson.thumbnails && rawJson.thumbnails.length > 0 ? rawJson.thumbnails[rawJson.thumbnails.length - 1].url : ''),
          formats: uniqueFormats,
          originalJson: rawJson,
        };

        appendLog(`Metadata successfully loaded: "${metadata.title}"`);
        resolve(metadata);
      } catch (err) {
        appendLog(`JSON parsing failed for metadata: ${err}`);
        reject(new Error('Failed to parse video metadata JSON stream.'));
      }
    });
  });
}

// Download Queue Manager
interface DownloadItem {
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
  options: any;
  addedAt: string;
}

const downloadQueue: DownloadItem[] = [];
const activeProcesses = new Map<string, any>(); // Map download id -> child process

function broadcastQueue() {
  if (mainWindow) {
    mainWindow.webContents.send('queue-updated', downloadQueue);
  }
}

async function processQueue() {
  const downloadingCount = downloadQueue.filter((item) => item.status === 'downloading').length;
  const maxConcurrent = appSettings.maxConcurrentDownloads || 2;

  if (downloadingCount >= maxConcurrent) {
    return;
  }

  const nextItem = downloadQueue.find((item) => item.status === 'queued');
  if (!nextItem) {
    return;
  }

  startDownloadProcess(nextItem);
}

function startDownloadProcess(item: DownloadItem) {
  if (ytDlpCommandBase.length === 0) {
    item.status = 'failed';
    item.error = 'yt-dlp is not installed or configured.';
    broadcastQueue();
    return;
  }

  item.status = 'downloading';
  broadcastQueue();

  appendLog(`Starting download: "${item.title}"`);

  // Construct arguments
  const args = [...ytDlpCommandBase.slice(1)];

  // Formats and quality
  if (item.format === 'MP4') {
    if (item.quality === 'Highest') {
      args.push('-f', 'bestvideo+bestaudio/best');
    } else if (item.quality) {
      // Find numeric height
      const height = item.quality.replace(/\D/g, '');
      args.push('-f', `bestvideo[height<=${height}]+bestaudio/best`);
    } else {
      args.push('-f', 'bestvideo+bestaudio/best');
    }
    args.push('--merge-output-format', 'mp4');
  } else if (item.format === 'MP3') {
    args.push('-f', 'bestaudio[ext=m4a]/bestaudio/best');
    args.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', '192K');
  } else {
    args.push('-f', 'best');
  }

  // Advanced toggles
  if (item.options.subtitles) {
    args.push('--write-subs', '--embed-subs');
  }
  if (item.options.thumbnail) {
    args.push('--write-thumbnail');
  }
  if (item.options.embedMetadata) {
    args.push('--embed-metadata');
  }

  // Global settings
  if (appSettings.cookiesPath && fs.existsSync(appSettings.cookiesPath)) {
    args.push('--cookiefile', appSettings.cookiesPath);
  }
  if (appSettings.proxy) {
    args.push('--proxy', appSettings.proxy);
  }
  if (appSettings.ffmpegPath) {
    args.push('--ffmpeg-location', appSettings.ffmpegPath);
  }
  if (appSettings.bandwidthLimit > 0) {
    args.push('--limit-rate', `${appSettings.bandwidthLimit}K`);
  }

  // Output destination template
  const outTemplate = path.join(appSettings.downloadFolder, '%(title)s.%(ext)s');
  args.push('-o', outTemplate);
  args.push(item.url);

  const cmd = ytDlpCommandBase[0];
  appendLog(`Running download cmd: ${cmd} ${args.join(' ')}`);

  const dlProcess = spawn(cmd, args, { shell: true });
  activeProcesses.set(item.id, dlProcess);

  // Parse logs for progress updates
  let errorLog = '';

  dlProcess.stdout.on('data', (data) => {
    const line = data.toString();

    // Check progress pattern e.g. [download]  12.5% of ~45.2MiB at  3.4MiB/s ETA 00:12
    // or [download]  95.0% of 100.00MiB at 10.00MiB/s ETA 00:01
    const progressRegex = /\[download\]\s+([\d.]+)\%\s+of\s+(\S+)\s+at\s+(\S+)\s+ETA\s+(\S+)/;
    const match = line.match(progressRegex);

    if (match) {
      const pct = parseFloat(match[1]);
      item.progress = pct;
      const total = match[2].replace('~', '');
      item.totalBytes = total;
      item.speed = match[3];
      item.eta = match[4];
      // Compute downloadedBytes from total and percentage
      try {
        const totalNum = parseFloat(total);
        if (!isNaN(totalNum) && totalNum > 0) {
          const unit = total.replace(/[\d.]/g, '').trim();
          const downloaded = (totalNum * pct / 100).toFixed(1);
          item.downloadedBytes = `${downloaded}${unit}`;
        }
      } catch (_) { /* ignore parse errors */ }
      broadcastQueue();
    } else {
      // Fallback for simple percentage
      const simpleRegex = /\[download\]\s+([\d.]+)\%/;
      const simpleMatch = line.match(simpleRegex);
      if (simpleMatch) {
        item.progress = parseFloat(simpleMatch[1]);
        broadcastQueue();
      }
    }
  });

  dlProcess.stderr.on('data', (data) => {
    errorLog += data.toString();
    appendLog(`[Download Error UI] ${data.toString().trim()}`);
  });

  dlProcess.on('close', (code) => {
    activeProcesses.delete(item.id);

    if (code === 0) {
      item.status = 'completed';
      item.progress = 100;
      item.speed = '0 B/s';
      item.eta = 'Done';
      appendLog(`Download finished: "${item.title}"`);
      addToHistory(item);
    } else {
      // If cancelled, keep cancelled status
      if (item.status !== 'cancelled' && item.status !== 'paused') {
        item.status = 'failed';
        item.error = errorLog.trim() || `Download failed with exit code ${code}`;
        appendLog(`Download failed: "${item.title}". Code ${code}. Error: ${item.error}`);
      }
    }

    broadcastQueue();
    processQueue(); // Run next queued items
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1060,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    frame: false, // Frameless UI
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0c0b11', // Prevent initial white flash
  });

  loadSettings();

  // Load dev server or built package index
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  appendLog('Application starting...');
  await detectDependencies();
  createWindow();

  // Polling clipboard URL
  let lastClipboardUrl = '';
  setInterval(() => {
    try {
      const { clipboard } = require('electron');
      const text = clipboard.readText().trim();
      const mediaUrlRegex = /^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|tiktok\.com|soundcloud\.com|twitch\.tv)\/\S+$/i;

      if (text && text !== lastClipboardUrl && mediaUrlRegex.test(text)) {
        lastClipboardUrl = text;
        if (mainWindow) {
          mainWindow.webContents.send('clipboard-url-detected', text);
          appendLog(`Clipboard URL detected: ${text}`);
        }
      }
    } catch (e) {
      // ignore
    }
  }, 1200);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Window Controls
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

// Settings IPCs
ipcMain.handle('settings-load', () => {
  return loadSettings();
});

ipcMain.handle('settings-save', (event, newSettings) => {
  return saveSettings(newSettings);
});

ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Download IPCs
ipcMain.handle('downloader-fetch-metadata', async (event, url, cookiesPath) => {
  return fetchMetadata(url, cookiesPath);
});

ipcMain.handle('downloader-start', (event, url, options) => {
  // Use a unique ID combining timestamp + random suffix to prevent collisions after queue clears
  const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  // Provide a friendly title derived from the URL filename, stripped of query params
  const rawPath = url.split('?')[0].split('/').pop() || 'Media File';
  const title = options.title || decodeURIComponent(rawPath);
  const newItem: DownloadItem = {
    id,
    url,
    title,
    thumbnail: options.thumbnail || '',
    format: options.format,
    quality: options.quality,
    status: 'queued',
    progress: 0,
    downloadedBytes: '0 B',
    totalBytes: 'Calculating...',
    speed: '0 KB/s',
    eta: '--:--',
    options,
    addedAt: new Date().toISOString(),
  };

  // If metadata wasn't pre-populated, try to fetch it for display (best effort)
  if (!options.title) {
    fetchMetadata(url)
      .then((metadata: any) => {
        newItem.title = metadata.title || newItem.title;
        newItem.thumbnail = metadata.thumbnail || '';
        broadcastQueue();
      })
      .catch((err) => {
        appendLog(`Sub-fetch metadata error for queue display: ${err.message}`);
      });
  }

  downloadQueue.push(newItem);
  broadcastQueue();
  processQueue();
  return newItem;
});

ipcMain.handle('downloader-pause', (event, id) => {
  const item = downloadQueue.find((i) => i.id === id);
  if (item && item.status === 'downloading') {
    const process = activeProcesses.get(id);
    if (process) {
      item.status = 'paused';
      process.kill(); // yt-dlp resumes from where it left off on file level natively!
      activeProcesses.delete(id);
      appendLog(`Download paused (killed process): "${item.title}"`);
    }
  }
  broadcastQueue();
  processQueue();
});

ipcMain.handle('downloader-resume', (event, id) => {
  const item = downloadQueue.find((i) => i.id === id);
  if (item && item.status === 'paused') {
    item.status = 'queued';
    appendLog(`Download resumed (re-queued): "${item.title}"`);
  }
  broadcastQueue();
  processQueue();
});

ipcMain.handle('downloader-cancel', (event, id) => {
  const item = downloadQueue.find((i) => i.id === id);
  if (item) {
    const process = activeProcesses.get(id);
    if (process) {
      process.kill();
      activeProcesses.delete(id);
    }
    item.status = 'cancelled';
    item.speed = '0 B/s';
    item.eta = 'Cancelled';
    appendLog(`Download cancelled: "${item.title}"`);
  }
  broadcastQueue();
  processQueue();
});

ipcMain.handle('downloader-retry', (event, id) => {
  const item = downloadQueue.find((i) => i.id === id);
  if (item) {
    item.status = 'queued';
    item.progress = 0;
    item.error = undefined;
    appendLog(`Retrying download: "${item.title}"`);
  }
  broadcastQueue();
  processQueue();
});

ipcMain.handle('downloader-clear-queue', () => {
  // Clear only finished/cancelled/failed items; keep active & queued ones
  const activeIds = new Set(activeProcesses.keys());
  const newQueue = downloadQueue.filter(
    (item) => activeIds.has(item.id) || item.status === 'downloading' || item.status === 'queued' || item.status === 'paused'
  );
  downloadQueue.length = 0;
  downloadQueue.push(...newQueue);
  broadcastQueue();
  return downloadQueue;
});

// History / Shell IPCs
ipcMain.handle('history-load', () => {
  return loadHistory();
});

ipcMain.handle('history-clear', () => {
  try {
    fs.writeFileSync(historyFilePath, JSON.stringify([], null, 2), 'utf-8');
    appendLog('Download history cleared.');
    return [];
  } catch (err) {
    appendLog(`Error clearing history: ${err}`);
  }
  return loadHistory();
});

ipcMain.handle('open-folder', (event, dirPath) => {
  const pathToCheck = dirPath || appSettings.downloadFolder;
  if (fs.existsSync(pathToCheck)) {
    shell.openPath(pathToCheck);
    appendLog(`Opened folder path: ${pathToCheck}`);
  } else {
    appendLog(`Folder does not exist: ${pathToCheck}`);
  }
});

ipcMain.handle('play-file', (event, filePath) => {
  // Resolve full file path from download history, and open it
  let absolutePath = filePath;
  // If it's a title, find matching files in downloadFolder
  if (!fs.existsSync(absolutePath)) {
    const matchName = path.join(appSettings.downloadFolder, path.basename(filePath));
    if (fs.existsSync(matchName)) {
      absolutePath = matchName;
    }
  }

  if (fs.existsSync(absolutePath)) {
    shell.openPath(absolutePath);
    appendLog(`Playing file: ${absolutePath}`);
  } else {
    // Search folders for any matching files with extension
    const folderFiles = fs.readdirSync(appSettings.downloadFolder);
    const baseWithoutExt = path.parse(filePath).name;
    const match = folderFiles.find((f) => f.startsWith(baseWithoutExt));
    if (match) {
      const foundPath = path.join(appSettings.downloadFolder, match);
      shell.openPath(foundPath);
      appendLog(`Playing fuzzy matched file: ${foundPath}`);
    } else {
      appendLog(`File not found to play: ${absolutePath}`);
    }
  }
});

// Diagnostics Check IPC
ipcMain.handle('diagnostics-check', async () => {
  const pythonStatus = await checkDependency('python --version');
  const ytDlpStatus = ytDlpCommandBase.length > 0;
  const ffmpegStatus = await checkDependency(appSettings.ffmpegPath ? `"${appSettings.ffmpegPath}" -version` : 'ffmpeg -version');

  const status = {
    python: pythonStatus ? 'Ready' : 'Not Installed',
    ytdlp: ytDlpStatus ? `Ready (${ytDlpCommandBase.join(' ')})` : 'Not Found',
    ffmpeg: ffmpegStatus ? 'Ready' : 'Not Found',
    os: `${process.platform} ${process.arch}`,
    node: process.version,
    appVersion: app.getVersion(),
    logsPath: logsFilePath,
  };
  return status;
});
