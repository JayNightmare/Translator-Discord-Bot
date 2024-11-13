import fetch from 'node-fetch';
import { API_URL } from '../config/config.js';
import { log } from '../utils/logger.js';
import { getFlagUrl, getLanguageName } from '../utils/languageUtils.js';

export async function translateText(text) {
    try {
        log(`Attempting to translate text: ${text}`);
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ q: text, source: "auto", target: "en", format: "text" }),
            headers: { "Content-Type": "application/json" }
        });
        
        if (!response.ok) throw new Error(`Translation API responded with status ${response.status}`);
        
        const data = await response.json();
        const languageCode = data.detectedLanguage.language;
        
        return {
            translatedText: data.translatedText,
            flagUrl: getFlagUrl(languageCode),
            languageName: getLanguageName(languageCode),
        };
    } catch (error) {
        log(`Translation error: ${error.message}`);
        throw error;
    }
}
