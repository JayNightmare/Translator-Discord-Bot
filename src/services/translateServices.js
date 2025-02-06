// const fetch = require( 'node-fetch');
const { API_URL } = require( '../config/config.js');

async function translateText(text) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ q: text, source: 'auto', target: 'en', format: 'text' }),
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error(`API responded with status ${response.status}`);
        const data = await response.json();

        const { translatedText } = data;
        const languageCode = data.detectedLanguage?.language || 'unknown';
        const confidence = data.detectedLanguage?.confidence || 0;

        return { translatedText, languageCode, confidence };
    } catch (error) {
        console.error('Translation API error:', error.message);
        return { translatedText: null, languageCode: null, confidence: 0 };
    }
}

module.exports = { translateText };