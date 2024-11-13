import { translateText } from '../services/translateService.js';
import { log } from '../utils/logger.js';
import { cleanMessage, shouldTranslate } from '../utils/messageUtils.js';

export async function handleTranslateCommand(message, ignoreWords) {
    const cleanedContent = cleanMessage(message.content);
    if (shouldTranslate(cleanedContent, ignoreWords)) {
        const { translatedText, flagUrl, languageName } = await translateText(cleanedContent);
        if (translatedText) {
            const embed = new EmbedBuilder()
                .setDescription(`${translatedText}`)
                .setFooter({ text: `Original: ${message.content} | Language: ${languageName}` });
            if (flagUrl) embed.setThumbnail(flagUrl);
            await message.delete();
            await message.channel.send({ embeds: [embed] });
            log('Message translated and sent successfully.');
        }
    }
}
