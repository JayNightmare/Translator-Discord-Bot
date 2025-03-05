require("dotenv").config();

const RAPIDAPI_CONFIG = {
    // ! Google API
    key: process.env.API_KEY,
    googleHost: 'google-translator9.p.rapidapi.com',
    googleDetectUrl: 'https://google-translator9.p.rapidapi.com/v2/detect',
    googleTranslateUrl: 'https://google-translator9.p.rapidapi.com/v2',
    googlelanguagesUrl: 'https://google-translator9.p.rapidapi.com/v2/languages',
    // ! Deepl API
    deepLHost: 'deepl-translator2.p.rapidapi.com',
    deepLUrl: 'https://deepl-translator2.p.rapidapi.com/translate',
};

module.exports = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    MONGODB_URI: process.env.MONGODB_URI,
    PORT: process.env.PORT || 3000,
    BUG_REPORT_WH: process.env.BUG_REPORT_WH,
    SUGGESTION_REPORT_WH: process.env.SUGGESTION_REPORT_WH,
    commandPrefix: 't!',
    API_URL: process.env.API_URL,
    RAPIDAPI_CONFIG
};
