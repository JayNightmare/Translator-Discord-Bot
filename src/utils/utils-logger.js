import fs from 'fs';
import path from 'path';

const logFilePath = path.join('logs', 'bot.log');

// Ensure the logs directory exists
if (!fs.existsSync('logs')) fs.mkdirSync('logs');

const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

export function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    logStream.write(`${logMessage}\n`);
    console.log(logMessage);
}
