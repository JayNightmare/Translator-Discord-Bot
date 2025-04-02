const { commandPrefix } = require('../config/config.js');
const { log } = require('../utils/utils-logger.js');
const IgnoreWord = require('../models/ignoreWordsModel.js');
const Blacklist = require('../models/Blacklist.js');
const { handleTranslateCommand } = require('../utils/utils-translate.js');

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
                    return log(`Command "${commandName}" not found.`);
                }

                await command.execute(message, args);
                return log(`Executed command: ${commandName}`);
            }

            // Handle translation logic for normal messages
            const blacklistedChannels = await Blacklist.find({ serverId: message.guild.id }).exec();
            const isBlacklisted = blacklistedChannels.some(
                (channel) => channel.channelId === message.channel.id
            );

            if (isBlacklisted) {
                return log(`Message in blacklisted channel (${message.channel.id}) ignored.`);
            }

            const serverId = message.guild.id;

            const ignoreWordsDocs = await IgnoreWord.find({}).exec();
            const ignoreWords = ignoreWordsDocs.map((doc) => doc.word);

            await handleTranslateCommand(message, ignoreWords, serverId);
        } catch (error) {
            log(`Error handling messageCreate event: ${error.message}`);
            console.error(error);
        }
    },
};
