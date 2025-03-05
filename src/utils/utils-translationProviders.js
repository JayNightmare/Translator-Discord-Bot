const axios = require('axios');
const { RAPIDAPI_CONFIG } = require('../config/config.js');

async function translateWithRapidAPI(text, sourceLanguage, targetLanguage, provider) {
    let options;

    if (provider === 'google') {
        options = {
            method: 'POST',
            url: RAPIDAPI_CONFIG.googleTranslateUrl,
            headers: {
                'x-rapidapi-key': RAPIDAPI_CONFIG.key,
                'x-rapidapi-host': RAPIDAPI_CONFIG.googleHost,
                'Content-Type': 'application/json'
            },
            data: {
                q: text,
                source: sourceLanguage,
                target: targetLanguage,
                format: 'text'
            }
        };

        try {
            const response = await axios.request(options);
            console.log(response.data);
            return response.data.data.translations[0].translatedText;
        } catch (error) { console.error(error); }
    } else if (provider === 'deepl') {
        options = {
            method: 'POST',
            url: RAPIDAPI_CONFIG.deepLUrl,
            headers: {
                'x-rapidapi-key': RAPIDAPI_CONFIG.key,
                'x-rapidapi-host': RAPIDAPI_CONFIG.deepLHost,
                'Content-Type': 'application/json'
            },
            data: {
                source_lang: sourceLanguage,
                target_lang: targetLanguage,
                text: text,
                format: 'text'
            }
        };

        try {
            const response = await axios.request(options);
            console.log(response.data);
            
            // get data from response
            return response.data.data;

        } catch (error) { console.error(error); }
    }
}

async function translateWithLibreTranslate(text, targetLanguage) {
    const url = process.env.API_URL;

    const response = await axios.post(url, { q: text, target: targetLanguage });
    return response.data.translatedText;
}

module.exports = {
    translateWithRapidAPI,
    translateWithLibreTranslate
};