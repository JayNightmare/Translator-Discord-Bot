const { translateText } = require( '../services/translateServices.js');
const { cleanMessage, shouldTranslate } = require( './utils-messageUtils.js');
const { log } = require( './utils-logger.js');
const Settings = require('../models/Settings');

async function handleTranslateCommand(message, ignoreWords, serverId) {
    const cleanedContent = cleanMessage(message.content);

    if (!shouldTranslate(cleanedContent, ignoreWords)) {
        log('Message contains ignored words, skipping translation.');
        return;
    }

    const { translatedText, flagUrl, languageName } = await translateText(cleanedContent, serverId);
    if (translatedText) {
        const settings = await Settings.findOne({ serverId });
        const messageType = settings?.messageType || 'embed_expanded';

        if (messageType === 'embed_expanded') {
            const embed = {
                color: 0x0099ff,
                author: {
                    name: message.author.displayName,
                    icon_url: message.author.displayAvatarURL(),
                },
                description: translatedText,
                footer: {
                    text: `Original: ${message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content} | Language: ${languageName}`,
                },
            };

            if (flagUrl) embed.thumbnail = { url: flagUrl };

            await message.channel.send({ embeds: [embed] });
        } else if (messageType === 'embed_minimal') {
            const embed = {
                color: 0x0099ff,
                author: {
                    name: message.author.displayName,
                    icon_url: message.author.displayAvatarURL(),
                },
                description: translatedText,
            };

            await message.channel.send({ embeds: [embed] });
        } else if (messageType === 'text_expanded') {
            await message.channel.send(
                `${translatedText}` +
                `-# Sent by: ${message.author.displayName}\n` +
                `-# Original: ${message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content}\n` +
                `-# Language: ${languageName}`
            );
        } else if (messageType === 'text_minimal') {
            await message.channel.send(
                `${translatedText}\n\n` +
                `-# Sent by: ${message.author.displayName}`
            );
        }

        try {
            await message.delete();
            log('Message translated and original message deleted successfully.');
        } catch (deleteError) {
            log(`Error deleting message: ${deleteError.message}`);
        }
    }
}

module.exports = {
    handleTranslateCommand
};