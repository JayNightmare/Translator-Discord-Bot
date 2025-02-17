const { log } = require("debug/src/browser");

function cleanMessage(content) {
    content = content
        .replace(/<:[a-zA-Z0-9_]+:[0-9]+>/g, '') // Remove custom emotes
        .replace(/:[a-zA-Z0-9_]+:/g, '')         // Remove text-based emotes
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '')  // Remove Unicode emojis
        .replace(/[^a-zA-Z0-9\s]/g, '')          // Remove special characters and symbols, only allow numbers and letters
        .trim();

    log(`Cleaned message: ${content}`);
    return content;
}

function shouldTranslate(content, ignoreWords) {
    if (content === '') {
        log('Message is empty or has been cleaned');
        return false;
    }
    const words = content.split(/\s+/);
    return !words.some((word) => ignoreWords.includes(word.toLowerCase()));
}

module.exports = { cleanMessage, shouldTranslate };