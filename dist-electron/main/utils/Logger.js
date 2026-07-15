"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const electron_log_1 = __importDefault(require("electron-log"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
class Logger {
    static initialize() {
        const logPath = path_1.default.join(electron_1.app.getPath('userData'), 'logs');
        // Configure all loggers
        [this.app, this.downloads, this.updater, this.error].forEach((logger) => {
            logger.transports.file.resolvePathFn = () => path_1.default.join(logPath, `${logger.logId}.log`);
            logger.transports.file.maxSize = 5 * 1024 * 1024; // 5MB rotation
            logger.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{label}] {text}';
        });
        this.app.info('Logger initialized. Logs are stored in', logPath);
    }
}
exports.Logger = Logger;
Logger.app = electron_log_1.default.create({ logId: 'app' });
Logger.downloads = electron_log_1.default.create({ logId: 'downloads' });
Logger.updater = electron_log_1.default.create({ logId: 'updater' });
Logger.error = electron_log_1.default.create({ logId: 'error' });
//# sourceMappingURL=Logger.js.map