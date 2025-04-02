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
const Settings = require('../models/Settings'); // Import Settings model
const languageMap = require('../utils/languageMap'); // Import a mapping of full names to shorthand codes

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

async function translateText(text, serverId) {
    try {
        log(`Attempting to translate text: ${text}`);
        
        // Fetch language settings from the database
        const settings = await Settings.findOne({ serverId });
        let targetLanguage = settings?.languageTo || 'en';
        let sourceLanguageFromDb = settings?.languageFrom || 'auto';

        log(`Settings for server ${serverId}: targetLanguage=${targetLanguage}, sourceLanguageFromDb=${sourceLanguageFromDb}`);

        // Convert full language names to shorthand codes
        targetLanguage = languageMap[targetLanguage.toLowerCase()] || targetLanguage;
        sourceLanguageFromDb = languageMap[sourceLanguageFromDb.toLowerCase()] || sourceLanguageFromDb;

        // Check cache first
        const cacheKey = getCacheKey(text, targetLanguage);
        if (translationCache.has(cacheKey)) {
            const cached = translationCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_EXPIRATION) {
                log(`Using cached translation for: ${text}`);
                return cached.result;
            }
        }

        // Detect the source language if not specified in the database
        const sourceLanguage = sourceLanguageFromDb === 'auto' 
            ? (await detectLanguage(text)).data.detections[0][0].language 
            : sourceLanguageFromDb;

        const confidence = sourceLanguageFromDb === 'auto' 
            ? (await detectLanguage(text)).data.detections[0][0].confidence 
            : 1.0;

        log(`Detected language: ${sourceLanguage} with confidence: ${confidence}`);

        // Skip translation if confidence is below 75% or source and target languages are the same
        if (confidence < 0.75 || sourceLanguage === targetLanguage) {
            log(`Translation skipped due to low confidence or identical source and target languages.`);
            return { translatedText: null, flagUrl: null, languageName: null };
        }

        let translatedText = null;
        
        // 1️⃣ Try Google Translate (via RapidAPI)
        try {
            log('Attempting to translate with Google Translate');
            translatedText = await translateWithRapidAPI(text, sourceLanguage, targetLanguage, 'google');
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
