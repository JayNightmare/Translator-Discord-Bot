export function getFlagUrl(languageCode) {
    const flagMap = { /* ... as in your original code ... */ };
    return flagMap[languageCode] || null;
}

export function getLanguageName(languageCode) {
    const languageMap = { /* ... as in your original code ... */ };
    return languageMap[languageCode] || "Unknown Language";
}
