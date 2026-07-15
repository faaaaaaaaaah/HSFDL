"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinaryManager = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const electron_1 = require("electron");
const Logger_1 = require("../utils/Logger");
class BinaryManager {
    static initialize() {
        if (electron_1.app.isPackaged) {
            // In production, binaries are copied to resources/binaries
            this.binariesPath = path_1.default.join(process.resourcesPath, 'binaries');
        }
        else {
            // In development, they are in the project root /binaries/win
            this.binariesPath = path_1.default.join(electron_1.app.getAppPath(), 'binaries', 'win');
        }
        this.verifyBinaries();
    }
    static verifyBinaries() {
        const required = ['ffmpeg.exe', 'ffprobe.exe', 'yt-dlp.exe'];
        let allPresent = true;
        for (const bin of required) {
            const binPath = path_1.default.join(this.binariesPath, bin);
            if (!fs_1.default.existsSync(binPath)) {
                Logger_1.Logger.error.error(`Missing critical binary: ${binPath}`);
                allPresent = false;
            }
        }
        if (allPresent) {
            Logger_1.Logger.app.info('All bundled binaries verified successfully.');
        }
    }
    static getFfmpegPath() {
        return path_1.default.join(this.binariesPath, 'ffmpeg.exe');
    }
    static getYtDlpPath() {
        return path_1.default.join(this.binariesPath, 'yt-dlp.exe');
    }
}
exports.BinaryManager = BinaryManager;
//# sourceMappingURL=BinaryManager.js.map