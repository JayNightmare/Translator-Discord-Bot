import { commandPrefix } from '../config/config.js';
import { handleTranslateCommand } from '../commands/translate.js';
import IgnoreWord from '../models/ignoreWordsModel.js';

export async function onMessageCreate(message) {
    if (message.author.bot) return;
    if (message.content.startsWith(commandPrefix)) {
        // Handle command-specific logic
    } else {
        const ignoreWords = await IgnoreWord.find({});
        handleTranslateCommand(message, ignoreWords.map(doc => doc.word));
    }
}
