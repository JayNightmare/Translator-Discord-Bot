import fs from 'fs';
import path from 'path';

const logFile = fs.createWriteStream(path.join(__dirname, '../bot.log'), { flags: 'a' });

export function log(message) {
    const timestamp = new Date().toISOString();
    logFile.write(`[${timestamp}] ${message}\n`);
    console.log(`[${timestamp}] ${message}`);
}
