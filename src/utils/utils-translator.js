function shouldTranslate(messageContent) {
    const words = messageContent.split(/\s+/);
    return !words.some(word => ignoreWords.includes(word.toLowerCase()));
}

async function translateText(text) {
}

function getFlagUrl(languageCode) {
}

function getLanguageName(languageCode) {
}

module.exports = {
    shouldTranslate,
    translateText,
    getFlagUrl,
    getLanguageName,
}