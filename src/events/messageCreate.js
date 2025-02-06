import { commandPrefix } from '../config/config.js';
import { log } from '../utils/utils-logger.js';
import IgnoreWord from '../models/ignoreWordsModel.js';
import Blacklist from '../models/Blacklist.js';
import { handleTranslateCommand } from '../utils/utils-translate.js';

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;

        try {
            // Handle commands
            if (message.content.startsWith(commandPrefix)) {
                const args = message.content.slice(commandPrefix.length).trim().split(/\s+/);
                const commandName = args.shift().toLowerCase();

                const command = message.client.commands.get(commandName);
                if (!command) {
                    log(`Command "${commandName}" not found.`);
                    return;
                }

                await command.execute(message, args);
                log(`Executed command: ${commandName}`);
                return;
            }

            // Handle translation logic for normal messages
            const blacklistedChannels = await Blacklist.find({ serverId: message.guild.id }).exec();
            const isBlacklisted = blacklistedChannels.some(
                (channel) => channel.channelId === message.channel.id
            );

            if (isBlacklisted) {
                log(`Message in blacklisted channel (${message.channel.id}) ignored.`);
                return;
            }

            // Fetch ignore words from the database
            const ignoreWordsDocs = await IgnoreWord.find({}).exec();
            const ignoreWords = ignoreWordsDocs.map((doc) => doc.word);

            await handleTranslateCommand(message, ignoreWords);
        } catch (error) {
            log(`Error handling messageCreate event: ${error.message}`);
            console.error(error);
        }
    },
};
