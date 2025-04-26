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
const Settings = require('../models/Settings');
const languageMap = require('../utils/language/languageMap.json');
const Blacklist = require('../models/Blacklist');

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

async function detectLanguage(text, serverId) {
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

const nameToCode = Object.fromEntries(
    Object.entries(languageMap).map(([code, name]) => [name, code])
);

async function translateText(text, serverId, commandTargetLanguage, commandSourceLanguage) {
    try {
        log(`Attempting to translate text: ${text}`);

        // Check if commandTargetLanguage and commandSourceLanguage are provided
        if (!commandTargetLanguage) commandSourceLanguage = null;
        if (!commandSourceLanguage) commandTargetLanguage = null;

        // Fetch language settings from the database
        const settings = await Settings.findOne({ serverId });
        if (!settings) {
            log(`No settings found for server ${serverId}`);
            // Create default settings if none exist
            await Settings.create({ serverId, languageTo: 'en', languageFrom: 'auto', autoTranslate: true });
        }

        // Check if auto-translation is disabled
        if (!settings?.autoTranslate) {
            log(`Auto-translation is disabled for server ${serverId}. Skipping translation.`);
            return { translatedText: null, flagUrl: null, languageName: null };
        }

        let targetLanguage = commandTargetLanguage || settings?.languageTo || 'en';
        let sourceLanguage = commandSourceLanguage || settings?.languageFrom || 'auto';

        // Convert full language names to shorthand codes
        targetLanguage = nameToCode[targetLanguage.toLowerCase()] || targetLanguage;
        sourceLanguage = nameToCode[sourceLanguage.toLowerCase()] || sourceLanguage;

        // Check cache first
        const cacheKey = getCacheKey(text, targetLanguage);
        if (translationCache.has(cacheKey)) {
            const cached = translationCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_EXPIRATION) {
                return cached.result;
            }
        }

        // If source language is specified and matches target, skip translation
        if (sourceLanguage !== 'auto' && sourceLanguage === targetLanguage) {
            log(`Translation skipped - source language matches target language`);
            return { translatedText: null , flagUrl: null, languageName: null };
        }

        let detectedSourceLanguage;
        let confidence;

        // Only detect language if source is auto
        if (sourceLanguage === 'auto') {
            const detection = await detectLanguage(text, serverId);
            detectedSourceLanguage = detection.data.detections[0][0].language;
            confidence = detection.data.detections[0][0].confidence;

            log(`Detected language: ${detectedSourceLanguage} with confidence: ${confidence}`);

            // Skip translation if confidence is low
            if (confidence < 0.75) {
                log(`Translation skipped due to low confidence`);
                return { translatedText: null, flagUrl: null, languageName: null };
            }
        } else {
            detectedSourceLanguage = sourceLanguage;
            confidence = 1.0;
        }

        // Check if the detected language is blacklisted
        const blacklist = await Blacklist.findOne({ serverId });
        if (blacklist && blacklist.blacklistedLanguages.includes(detectedSourceLanguage)) {
            log(`Blocked translation from blacklisted language: ${detectedSourceLanguage}`);
            throw new Error(`Blacklisted language detected: ${detectedSourceLanguage}`);
        }

        let translatedText = null;

        // 1️⃣ Try Google Translate (via RapidAPI)
        try {
            log('Attempting to translate with Google Translate');
            translatedText = await translateWithRapidAPI(text, detectedSourceLanguage, targetLanguage, 'google');
        } catch (error) {
            log(`Google Translate failed: ${error.message}`);
        }

        // 2️⃣ If Google fails, try DeepL (via RapidAPI)
        if (!translatedText) {
            try {
                log('Attempting to translate with DeepL');
                translatedText = await translateWithRapidAPI(text, detectedSourceLanguage, targetLanguage, 'deepl');
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

        const flagUrl = getFlagUrl(detectedSourceLanguage);
        const languageName = getLanguageName(detectedSourceLanguage);

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

module.exports = { translateText, detectLanguage };
