const { translateText } = require( '../services/translateServices.js');
const { cleanMessage, shouldTranslate } = require( './utils-messageUtils.js');
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
                text: `Original: ${message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content} | Language: ${languageName}`,
            },
        };

        if (flagUrl) embed.thumbnail = { url: flagUrl };

        await message.channel.send({ embeds: [embed] });
        try {
            await message.delete();
            log('Message translated and original message deleted successfully.');
        } catch (deleteError) {
            log(`Error deleting message: ${deleteError.message}`);
            // Continue even if deletion fails
        }
    }
}

module.exports = { handleTranslateCommand };