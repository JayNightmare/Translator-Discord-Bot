const axios = require('axios');
const { log } = require('../utils/utils-logger');
const {
    getFlagUrl,
    getLanguageName
} = require('../utils/utils-getHolder.js');

const {
    translateWithRapidAPI,
    translateWithLibreTranslate
} = require('../utils/utils-translationProviders.js');

const { RAPIDAPI_CONFIG } = require('../config/config.js');

// Translation cache with expiration
const translationCache = new Map();
const CACHE_EXPIRATION = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 1000;

function getCacheKey(text, targetLanguage) {
    return `${text.toLowerCase()}|${targetLanguage}`;
}

function cleanupCache() {
    const now = Date.now();
    for (const [key, value] of translationCache.entries()) {
        if (now - value.timestamp > CACHE_EXPIRATION) {
            translationCache.delete(key);
        }
    }
    
    // If cache is still too large, remove oldest entries
    if (translationCache.size > MAX_CACHE_SIZE) {
        const entries = Array.from(translationCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < entries.length - MAX_CACHE_SIZE; i++) {
            translationCache.delete(entries[i][0]);
        }
    }
}

async function detectLanguage(text) {
    try {
        const options = {
            method: 'POST',
            url: RAPIDAPI_CONFIG.googleDetectUrl,
            headers: {
                'x-rapidapi-key': RAPIDAPI_CONFIG.key,
                'x-rapidapi-host': RAPIDAPI_CONFIG.googleHost,
                'Content-Type': 'application/json'
            },
            data: { q: text }
        };
        
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        log(`Language detection error: ${error.stack || error.message}`);
        throw error;
    }
}

async function translateText(text, targetLanguage = 'en') {
    try {
        log(`Attempting to translate text: ${text}`);
        
        // Check cache first
        const cacheKey = getCacheKey(text, targetLanguage);
        if (translationCache.has(cacheKey)) {
            const cached = translationCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_EXPIRATION) {
                log(`Using cached translation for: ${text}`);
                return cached.result;
            }
        }

        // First detect the source language
        const detection = await detectLanguage(text);
        const sourceLanguage = detection.data.detections[0][0].language;
        const confidence = detection.data.detections[0][0].confidence;

        log(`Detected language: ${sourceLanguage} with confidence: ${confidence}`);

        // ! Skip translation if confidence is below 35%
        if (confidence < 0.75) {
            log(`Translation skipped due to low confidence: ${confidence}`);
            return { translatedText: null, flagUrl: null, languageName: null };
        }

        if (sourceLanguage === targetLanguage) {
            log(`Translation skipped because source and target languages are the same: ${sourceLanguage}`);
            return { translatedText: null, flagUrl: null, languageName: null };
        }

        let translatedText = null;
        
        // 1️⃣ Try Google Translate (via RapidAPI)
        try {
            log('Attempting to translate with Google Translate');
            translatedText = await translateWithRapidAPI(text, sourceLanguage, targetLanguage, 'google');
            // translatedText = null;
        } catch (error) {
            log(`Google Translate failed: ${error.message}`);
        }

        // 2️⃣ If Google fails, try DeepL (via RapidAPI)
        if (!translatedText) {
            try {
                log('Attempting to translate with DeepL');
                translatedText = await translateWithRapidAPI(text, sourceLanguage, targetLanguage, 'deepl');
            } catch (error) {
                log(`DeepL Translate failed: ${error.message}`);
            }
        }

        // 3️⃣ If both fail, try LibreTranslate
        if (!translatedText) {
            try {
                log('Attempting to translate with LibreTranslate');
                translatedText = await translateWithLibreTranslate(text, targetLanguage);
            } catch (error) {
                log(`LibreTranslate failed: ${error.message}`);
            }
        }

        // 4️⃣ If ALL fail, return an error
        if (!translatedText) {
            throw new Error('All translation services failed');
        }

        const flagUrl = getFlagUrl(sourceLanguage);
        const languageName = getLanguageName(sourceLanguage);

        const result = { translatedText, flagUrl, languageName };

        // Update cache
        translationCache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });
        cleanupCache();

        return result;
    } catch (error) {
        log(`Translation error: ${error.stack || error.message}`);
        throw error;
    }
}

module.exports = { translateText };
