export function cleanMessage(content) {
    return content
        .replace(/<:[a-zA-Z0-9_]+:[0-9]+>/g, '') 
        .replace(/:[a-zA-Z0-9_]+:/g, '')        
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '')   
        .trim();
}

export function shouldTranslate(messageContent, ignoreWords) {
    const words = messageContent.split(/\s+/);
    return !words.some(word => ignoreWords.includes(word.toLowerCase()));
}
