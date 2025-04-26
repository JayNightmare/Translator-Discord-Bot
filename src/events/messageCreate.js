const { commandPrefix } = require('../config/config.js');
const { log } = require('../utils/utils-logger.js');
const IgnoreWord = require('../models/ignoreWordsModel.js');
const Blacklist = require('../models/Blacklist.js');
const Settings = require('../models/Settings.js');
const { handleTranslateCommand } = require('../utils/utils-translate.js');
const { detectLanguage, translateText } = require('../services/translateServices.js');
const { EmbedBuilder } = require('discord.js');
const languageMap = require('../utils/language/languageMap.json');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // ! Ignore bot messages
        if (message.author.bot) return;

        try {
            const serverId = message.guild.id;
            const blacklist = await Blacklist.findOne({ serverId });
            if (!blacklist) { await Blacklist.create({ serverId }); }

            // * Fetch logging channel ID from Settings schema
            const settings = await Settings.findOne({ serverId });
            if (!settings) { await Settings.create({ serverId }); }
            const loggingChannelId = settings?.loggingChannelId;

            // Format the blacklisted channels so <, #, and > are removed
            const blacklistedChannels = blacklist?.blacklistedChannels.map(channel => channel.replace(/<|#|>/g, '')) || [];
            const blacklistedRoles = blacklist?.blacklistedRoles.map(role => role.replace(/<|@|&|>/g, '')) || [];

            // * Check for blacklisted channels
            if (blacklistedChannels?.includes(message.channel.id)) {
                return log(`Message in blacklisted channel (${message.channel.id}) ignored.`);
            }

            // * Check for blacklisted roles
            const memberRoles = message.member?.roles.cache.map(role => role.id) || [];
            if (blacklistedRoles.some(roleId => memberRoles.includes(roleId))) {
                return log(`Message from user with blacklisted role ignored.`);
            }

            // * Detect message language first
            const detectedLanguageData = await detectLanguage(message.content, serverId);
            const detectedLanguage = detectedLanguageData?.data?.detections[0][0]?.language;

            const nameToCode = Object.fromEntries(
                Object.entries(languageMap).map(([code, name]) => [name, code])
            );

            // * Convert blacklisted languages from names to codes using languageMap
            const normalizedBlacklistedLanguages = blacklist?.blacklistedLanguages.map(lang => {
                const code = nameToCode[lang.toLowerCase()];
                if (!code) log(`Warning: Unknown language in blacklist - "${lang}"`);
                return code || lang;
            });

            // * Check for blacklisted languages
            if (normalizedBlacklistedLanguages?.includes(detectedLanguage)) {
                log(`Blacklisted language detected: ${detectedLanguage}`);
                await sendBlacklistLog(message, loggingChannelId, 'Language', detectedLanguage);
                await message.delete();
                return;
            }

            // * Check for blacklisted words in original and translated content
            const blacklistedWords = blacklist?.blacklistedWords || [];
            
            // Check in original content
            const blacklistedWordOriginal = blacklistedWords.find(word =>
                message.content.toLowerCase().includes(word.toLowerCase())
            );

            if (blacklistedWordOriginal) {
                log(`Blacklisted word detected in original text: ${blacklistedWordOriginal}`);
                await sendBlacklistLog(message, loggingChannelId, 'Word', blacklistedWordOriginal);
                await message.delete();
                return;
            }

            // Translate blacklisted words to detected language and check
            if (detectedLanguage && blacklistedWords.length > 0) {
                try {
                    const translatedBlacklistWords = await Promise.all(
                        blacklistedWords.map(async word => {
                            const { translatedText } = await translateText(word, serverId, detectedLanguage);
                            return translatedText?.toLowerCase();
                        })
                    );

                    const blacklistedWordTranslated = translatedBlacklistWords.find(word =>
                        word && message.content.toLowerCase().includes(word)
                    );

                    if (blacklistedWordTranslated) {
                        log(`Translated blacklisted word detected: ${blacklistedWordTranslated}`);
                        await sendBlacklistLog(message, loggingChannelId, 'Translated Word', blacklistedWordTranslated);
                        await message.delete();
                        return;
                    }
                } catch (error) {
                    log(`Error checking translated blacklist words: ${error.message}`);
                }
            }

            // ! Handle commands
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

            // * Handle translation logic for normal messages
            const ignoreWordsDocs = await IgnoreWord.find({}).exec();
            const ignoreWords = ignoreWordsDocs.map((doc) => doc.word);

            await handleTranslateCommand(message, ignoreWords, serverId);
        } catch (error) {
            log(`Error handling messageCreate event: ${error.message}`);
            console.error(error);
        }
    },
};

async function sendBlacklistLog(message, loggingChannelId, type, detectedContent) {
    const logChannel = message.guild.channels.cache.get(loggingChannelId);
    if (logChannel) {
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`Blacklisted ${type} Detected`)
            .setDescription(`This user has violated the blacklist rules:`)
            .addFields(
                { name: 'Message', value: message.content, inline: false },
                { name: 'User', value: `<@${message.author.id}> (${message.author.id})`, inline: true },
                {
                    name: 'Channel',
                    value: `[Jump to Message](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`,
                    inline: true
                },
                { name: type, value: detectedContent, inline: true }
            )
            .setFooter({ text: 'Please take appropriate action' })
            .setTimestamp();
        await logChannel.send({ embeds: [embed] });
    }
}
