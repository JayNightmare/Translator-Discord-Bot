require("dotenv").config();

const RAPIDAPI_CONFIG = {
    key: process.env.RAPIDAPI_KEY,
    host: 'google-translator9.p.rapidapi.com',
    detectUrl: 'https://google-translator9.p.rapidapi.com/v2/detect',
    translateUrl: 'https://google-translator9.p.rapidapi.com/v2',
    languagesUrl: 'https://google-translator9.p.rapidapi.com/v2/languages'
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
