const { commandPrefix } = require('../config/config.js');
const { log } = require('../utils/utils-logger.js');
const IgnoreWord = require('../models/ignoreWordsModel.js');
const Blacklist = require('../models/Blacklist.js');
const Settings = require('../models/Settings.js');
const { handleTranslateCommand } = require('../utils/utils-translate.js');
const { detectLanguage } = require('../services/translateServices.js');
const { EmbedBuilder } = require('discord.js');
const { languageMap } = require('../utils/languageMap.js');

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

            // * Check for blacklisted words
            const blacklistedWord = blacklist?.blacklistedWords.find(word =>
                message.content.toLowerCase().includes(word.toLowerCase())
            );
            if (blacklistedWord) {
                log(`Blacklisted word detected: ${blacklistedWord}`);
                const logChannel = message.guild.channels.cache.get(loggingChannelId);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Blacklisted Word Detected')
                        .setDescription(`This user has violated the blacklist rules:`)
                        .addFields(
                            { name: 'Message', value: message.content, inline: false },
                            { name: 'User', value: `<@${message.author.id}> (${message.author.id})`, inline: true },
                            {
                                name: 'Channel',
                                value: `[Jump to Message](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`,
                                inline: true
                            },
                            { name: 'Word', value: blacklistedWord, inline: true }
                        )
                        .setFooter({ text: 'Please take appropriate action' })
                        .setTimestamp();
                    logChannel.send({ embeds: [embed] });
                }
                await message.delete();
                return;
            }

            // * Convert blacklisted languages from names to codes using languageMap
            const normalizedBlacklistedLanguages = blacklist?.blacklistedLanguages.map(lang => {
                const code = languageMap[lang.toLowerCase()];
                if (!code) log(`Warning: Unknown language in blacklist - "${lang}"`);
                return code || lang;
            });
            
            // * Detect language and check for blacklisted languages
            const detectedLanguage = (await detectLanguage(message.content, serverId))?.data?.detections[0][0]?.language;
            if (normalizedBlacklistedLanguages?.includes(detectedLanguage)) {
                log(`Blacklisted language detected: ${detectedLanguage}`);
                const logChannel = message.guild.channels.cache.get(loggingChannelId);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Blacklisted Language Detected')
                        .setDescription(`Detected language: ${detectedLanguage}. This user has violated the blacklist rules:`)
                        .addFields(
                            { name: 'Message', value: message.content, inline: false },
                            { name: 'User', value: `<@${message.author.id}> (${message.author.id})`, inline: true },
                            {
                                name: 'Channel',
                                value: `[Jump to Message](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`,
                                inline: true
                            },
                            { name: 'Language', value: detectedLanguage, inline: true }
                        )
                        .setTimestamp();
                    logChannel.send({ embeds: [embed] });
                }
                await message.delete();
                return;
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
