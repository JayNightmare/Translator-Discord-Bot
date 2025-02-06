const fs = require('fs');
const path = require('path');

// const __dirname = path.dirname(require.main.filename);

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logFilePath = path.join(logsDir, 'bot.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    logStream.write(`${logMessage}\n`);
    console.log(logMessage);
}

module.exports = { log };
