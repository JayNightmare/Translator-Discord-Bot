const {
    getFlagUrl,
    getLanguageName
} = require('./utils-getHolder.js');

const API_URL = require('../configs/config.js').API_URL;

function shouldTranslate(messageContent) {
    const words = messageContent.split(/\s+/);
    return !words.some(word => ignoreWords.includes(word.toLowerCase()));
}

async function translateText(text) {
    try {
        log(`Attempting to translate text: ${text}`);
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                q: text,
                source: "auto",
                target: "en",
                format: "text"
            }),
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error(`Translation API responded with status ${response.status}`);

        const data = await response.json();
        log(`API Response: ${JSON.stringify(data)}`);
        console.log(data);

        // Extract the confidence score
        const confidence = data.detectedLanguage?.confidence;
        log(`Detected confidence: ${confidence}`);

        // Skip translation if confidence is below 35%
        if (confidence !== undefined && confidence < 35) {
            log(`Translation skipped due to low confidence: ${confidence}`);
            return { translatedText: null, flagUrl: null, languageName: null };
        }

        const languageCode = data.detectedLanguage.language;

        const flagUrl = getFlagUrl(languageCode);
        const languageName = getLanguageName(languageCode);

        return { translatedText: data.translatedText, flagUrl, languageName };
    }
    catch (error) {
        log(`Translation error: ${error.stack || error.message}`);
        throw error; // Re-throw to be caught by the calling function
    }
}

module.exports = {
    shouldTranslate,
    translateText
}