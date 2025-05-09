const fs = require('fs');
const path = require('path');
const { setTimeout } = require('timers/promises');

// const __dirname = path.dirname(require.main.filename);

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logFilePath = path.join(logsDir, 'bot.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

async function log(message) {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16); // Format: YYYY-MM-DD HH:mm
    const callerFile = (new Error().stack.split('\n')[2] || '').trim().split(' ').pop();
    const logMessage = `[${timestamp}] [${callerFile}] ${message}`;
    logStream.write(`${logMessage}\n`);
    console.log(logMessage);
    await setTimeout(10); // Adjust the delay as needed
}

module.exports = { log };
