const { translateText } = require('../services/translateServices.js');
const { cleanMessage, shouldTranslate } = require('./utils-messageUtils.js');
const { log } = require('./utils-logger.js');
const Settings = require('../models/Settings');

async function handleTranslateCommand(message, ignoreWords, serverId) {
    try {
        const cleanedContent = cleanMessage(message.content);

        if (!shouldTranslate(cleanedContent, ignoreWords)) {
            log('Message contains ignored words, skipping translation.');
            return;
        }

        // Get server settings for translation
        const settings = await Settings.findOne({ serverId });
        if (!settings?.autoTranslate) {
            log('Auto-translation is disabled for this server.');
            return;
        }

        const { translatedText, flagUrl, languageName } = await translateText(cleanedContent, serverId);
        
        // If no translation was returned (due to blacklist, language match, etc.), skip
        if (!translatedText) {
            log('No translation available or needed.');
            return;
        }

        const messageType = settings?.messageType || 'embed_expanded';

        switch (messageType) {
            case 'embed_expanded':
                const embedExpanded = {
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

                if (flagUrl) embedExpanded.thumbnail = { url: flagUrl };
                await message.channel.send({ embeds: [embedExpanded] });
                break;

            case 'embed_minimal':
                const embedMinimal = {
                    color: 0x0099ff,
                    author: {
                        name: message.author.displayName,
                        icon_url: message.author.displayAvatarURL(),
                    },
                    description: translatedText,
                };
                await message.channel.send({ embeds: [embedMinimal] });
                break;

            case 'text_expanded':
                await message.channel.send(
                    `${translatedText}\n` +
                    `-# Sent by: ${message.author.displayName}\n` +
                    `-# Original: ${message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content}\n` +
                    `-# Language: ${languageName}`
                );
                break;

            case 'text_minimal':
                await message.channel.send(
                    `${translatedText}\n\n` +
                    `-# Sent by: ${message.author.displayName}`
                );
                break;

            default:
                log(`Unknown message type: ${messageType}`);
                return;
        }

        try {
            await message.delete();
            log('Message translated and original message deleted successfully.');
        } catch (deleteError) {
            log(`Error deleting message: ${deleteError.message}`);
        }
    } catch (error) {
        log(`Error in handleTranslateCommand: ${error.message}`);
        // Don't throw the error - just log it and continue
    }
}

module.exports = {
    handleTranslateCommand
};
