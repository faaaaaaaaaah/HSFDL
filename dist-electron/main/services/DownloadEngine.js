"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadEngine = void 0;
const child_process_1 = require("child_process");
const BinaryManager_1 = require("./BinaryManager");
const SettingsManager_1 = require("./SettingsManager");
class DownloadEngine {
    static async fetchMetadata(url) {
        return new Promise((resolve, reject) => {
            const ytDlpPath = BinaryManager_1.BinaryManager.getYtDlpPath();
            const process = (0, child_process_1.spawn)(ytDlpPath, ['--dump-json', url]);
            let output = '';
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            process.on('close', (code) => {
                if (code === 0) {
                    try {
                        const parsed = JSON.parse(output);
                        resolve({
                            id: parsed.id,
                            title: parsed.title,
                            thumbnail: parsed.thumbnail,
                            duration: parsed.duration,
                            resolution: parsed.resolution || 'unknown',
                            formats: parsed.formats || [],
                            estimatedSize: parsed.filesize || parsed.filesize_approx || 0
                        });
                    }
                    catch (e) {
                        reject(new Error('Failed to parse metadata'));
                    }
                }
                else {
                    reject(new Error('yt-dlp process failed'));
                }
            });
        });
    }
    static startDownload(item, onProgress) {
        const ytDlpPath = BinaryManager_1.BinaryManager.getYtDlpPath();
        const settings = SettingsManager_1.SettingsManager.getSettings();
        const ffmpegPath = BinaryManager_1.BinaryManager.getFfmpegPath();
        const args = [
            item.url,
            '--ffmpeg-location', ffmpegPath,
            '--paths', settings.downloadPath,
            '--newline' // Ensure progress output is parsable
        ];
        if (settings.bandwidthLimit > 0) {
            args.push('--limit-rate', `${settings.bandwidthLimit}K`);
        }
        const child = (0, child_process_1.spawn)(ytDlpPath, args);
        this.activeDownloads.set(item.id, child);
        child.stdout.on('data', (data) => {
            const str = data.toString();
            // Basic progress parsing (yt-dlp outputs [download] 45.0% of 10.00MiB at 1.20MiB/s ETA 00:05)
            // This is a simplified regex for demonstration
            const progressMatch = str.match(/\[download\]\s+([\d\.]+)%/);
            if (progressMatch) {
                item.progress = parseFloat(progressMatch[1]);
                item.status = 'downloading';
                onProgress(item);
            }
        });
        child.on('close', (code) => {
            this.activeDownloads.delete(item.id);
            if (code === 0) {
                item.status = 'completed';
                item.progress = 100;
            }
            else {
                item.status = 'error';
                item.error = 'Download failed';
            }
            onProgress(item);
        });
    }
    static cancelDownload(id) {
        const child = this.activeDownloads.get(id);
        if (child) {
            child.kill('SIGINT');
            this.activeDownloads.delete(id);
        }
    }
}
exports.DownloadEngine = DownloadEngine;
DownloadEngine.activeDownloads = new Map();
//# sourceMappingURL=DownloadEngine.js.map