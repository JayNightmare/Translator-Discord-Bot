const { translateText } = require( '../services/translateServices.js');
const { cleanMessage, shouldTranslate } = require( './utils-translator.js');
const { log } = require( './utils-logger.js');

async function handleTranslateCommand(message, ignoreWords) {
    const cleanedContent = cleanMessage(message.content);

    if (!shouldTranslate(cleanedContent, ignoreWords)) {
        log('Message contains ignored words, skipping translation.');
        return;
    }

    const { translatedText, flagUrl, languageName } = await translateText(cleanedContent);
    if (translatedText) {
        const embed = {
            color: 0x0099ff,
            author: {
                name: message.author.username,
                icon_url: message.author.displayAvatarURL(),
            },
            description: translatedText,
            footer: {
                text: `Original: ${message.content} | Language: ${languageName}`,
            },
        };

        if (flagUrl) embed.thumbnail = { url: flagUrl };

        await message.channel.send({ embeds: [embed] });
        log('Message translated and sent successfully.');
    }
}

module.exports = { handleTranslateCommand };