function cleanMessage(content) {
    return content
        .replace(/<:[a-zA-Z0-9_]+:[0-9]+>/g, '') // Remove custom emotes
        .replace(/:[a-zA-Z0-9_]+:/g, '')         // Remove text-based emotes
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '')  // Remove Unicode emojis
        .trim();
}

function shouldTranslate(content, ignoreWords) {
    const words = content.split(/\s+/);
    return !words.some((word) => ignoreWords.includes(word.toLowerCase()));
}

module.exports = { cleanMessage, shouldTranslate };