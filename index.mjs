import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import langdetect from 'langdetect';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup log file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = fs.createWriteStream(path.join(__dirname, 'bot.log'), { flags: 'a' });

const ignoreWordsPath = './ignoreWords.json';
const blacklistedChannelsPath = './blacklist.json';
let ignoreWords = [];
let blacklist = {};

const commandPrefix = 't.';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const API_URL = process.env.API_URL;

// Logging function
function log(message) {
    const timestamp = new Date().toISOString();
    logFile.write(`[${timestamp}] ${message}\n`);
    console.log(`[${timestamp}] ${message}`);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    log(`Connected to servers: ${client.guilds.cache.map(guild => `${guild.name} (ID: ${guild.id})`).join(', ')}`);

    // Log the blacklisted channels for each server
    client.guilds.cache.forEach(guild => {
        const blacklisted = blacklist[guild.id] || [];
        const blacklistedNames = blacklisted.map(channelId => {
            const channel = guild.channels.cache.get(channelId);
            return channel ? `${channel.name} (ID: ${channelId})` : `Unknown (ID: ${channelId})`;
        });
        log(`Blacklisted channels in ${guild.name} (${guild.id}): ${blacklistedNames.join(', ')}`);
    });
});

// Load existing ignore words and blacklisted channels from file
if (fs.existsSync(ignoreWordsPath)) {
    const data = fs.readFileSync(ignoreWordsPath);
    ignoreWords = JSON.parse(data);
}

if (fs.existsSync(ignoreWordsPath)) {
    try {
        const data = fs.readFileSync(ignoreWordsPath, 'utf8');
        if (data.trim()) {
            ignoreWords = JSON.parse(data);
        } else {
            log('Ignore words file is empty.');
        }
    } catch (error) {
        log(`Failed to parse ignoreWords.json: ${error.message}`);
        console.error('Error parsing ignoreWords.json:', error);
    }
}

// Save blacklisted channels to file
function saveBlacklistedChannels() {
    fs.writeFileSync(blacklistedChannelsPath, JSON.stringify(blacklist, null, 2));
}

// Load ignore words
function saveIgnoreWords() {
    fs.writeFileSync(ignoreWordsPath, JSON.stringify(ignoreWords, null, 2));
}

function cleanMessage(content) {
    return content
        .replace(/<:[a-zA-Z0-9_]+:[0-9]+>/g, '')  // Remove custom emotes
        .replace(/:[a-zA-Z0-9_]+:/g, '')          // Remove text-based emotes
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '')   // Remove standard Unicode emojis
        .trim();
}

function createIgnoreWordsEmbed(page = 1) {
    const wordsPerPage = 50;
    const totalPages = Math.ceil(ignoreWords.length / wordsPerPage);
    const startIndex = (page - 1) * wordsPerPage;
    const endIndex = startIndex + wordsPerPage;
    const wordsToShow = ignoreWords.slice(startIndex, endIndex);

    // * Set the desired column width
    const columnWidth = 25; // * Adjust this value as needed for spacing

    // * Format words into 2 columns with a specified width
    let formattedWords = '';
    for (let i = 0; i < wordsToShow.length; i += 2) {
        const word1 = `${startIndex + i + 1}. ${wordsToShow[i] || ''}`.padEnd(columnWidth);
        const word2 = wordsToShow[i + 1] ? `${startIndex + i + 2}. ${wordsToShow[i + 1] || ''}` : ''; // Avoids adding undefined
        formattedWords += `${word1}${word2}\n`;
    }

    const embed = new EmbedBuilder()
        .setTitle('Ignored Words')
        .setDescription(`\`\`\`${formattedWords}\`\`\``)
        .setFooter({ text: `Page ${page} of ${totalPages}` });

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('prev10')
            .setLabel('Previous 10')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page <= 10),
        new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 1),
        new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages),
        new ButtonBuilder()
            .setCustomId('next10')
            .setLabel('Next 10')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page + 10 > totalPages)
    );

    return { embed, buttons };
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    let currentPage = parseInt(interaction.message.embeds[0].footer.text.match(/Page (\d+) of/)[1]);

    if (interaction.customId === 'prev10') { currentPage -= 10; }
    if (interaction.customId === 'prev') { currentPage--; } 
    if (interaction.customId === 'next') { currentPage++; } 
    if (interaction.customId === 'next10') { currentPage += 10; }

    // Ensure the page is within valid range
    if (currentPage < 1) currentPage = 1;
    if (currentPage > Math.ceil(ignoreWords.length / 50)) currentPage = Math.ceil(ignoreWords.length / 50);
    
    const { embed, buttons } = createIgnoreWordsEmbed(currentPage);
    await interaction.update({ embeds: [embed], components: [buttons] });
});


client.on('messageCreate', async (message) => {
    try {
        // * Check if the message is from a blacklisted channel
        const isBlacklisted = blacklist[message.guild.id] && blacklist[message.guild.id].includes(message.channel.id);

        // * List of management commands that can bypass the blacklist
        const managementCommands = ['addbl', 'rmbl', 'viewbl'];

        // * Extract the command from the message content
        const [command] = message.content.slice(commandPrefix.length).trim().split(/\s+/);

        // * Allow management commands even in blacklisted channels
        if (isBlacklisted && !managementCommands.includes(command)) {
            log('Message is in a blacklisted channel, ignoring.');
            return;
        }

        // * Initialize blacklist for the server if it doesn't exist
        if (!blacklist[message.guild.id]) {
            blacklist[message.guild.id] = message.guild.channels.cache.map(channel => channel.id);
            saveBlacklistedChannels();
        }

        // * Ignore messages from blacklisted channels if not a management command
        if (isBlacklisted && !managementCommands.includes(command)) {
            log(`Message in blacklisted channel ${message.channel.id} ignored.`);
            return;
        }

        // * Ignore bot messages
        if (message.author.bot) return;

        if (message.content.startsWith(commandPrefix)) {
            // ? Command handling logic
            const [command, ...args] = message.content.slice(commandPrefix.length).trim().split(/\s+/);

            if (!message.member.permissions.has('MANAGE_MESSAGES')) {
                return message.reply('You do not have permission to use this command.');
            }

            // * Normal Commands *
            if (command === 'view') {
                const { embed, buttons } = createIgnoreWordsEmbed();
                message.channel.send({ embeds: [embed], components: [buttons] });
                console.log("View called\n" + `Ignore list: ${ignoreWords.join(', ')}`);
            }

            if (command === 'rm') {
                const word = args[0];
                ignoreWords = ignoreWords.filter(w => w !== word.toLowerCase());
                saveIgnoreWords(); // Save updated list to file
                message.reply(`Removed "${word}" from the ignore list.`);
                console.log(`Removed "${word}" from the ignore list.`);
            }

            if (command === 'addi') {
                const word = args[0];
                if (word && !ignoreWords.includes(word.toLowerCase())) {
                    ignoreWords.push(word.toLowerCase());
                    saveIgnoreWords(); // Save updated list to file
                    message.reply(`Added "${word}" to the ignore list.`);
                    console.log(`Added "${word}" to the ignore list.`);
                } else {
                    message.reply(`${word ? `"${word}" is already in the ignore list.` : "Please specify a word to add."}`);
                }
            }
            // !!!!

            // * Black List Commands *
            if (command === 'addbl') {
                const channelId = args[0];
                if (!blacklist[message.guild.id].includes(channelId)) {
                    return message.reply(`Channel ${channelId} is not blacklisted.`);
                }

                blacklist[message.guild.id] = blacklist[message.guild.id].filter(id => id !== channelId);
                saveBlacklistedChannels(); // Save updated blacklist to file
                message.reply(`Channel <#${channelId}> has been removed from the blacklist.`);
                console.log(`Channel ${channelId} has been removed from the blacklist.`);
            }

            if (command === 'viewbl') {
                const blacklisted = blacklist[message.guild.id] || [];
                if (blacklisted.length === 0) {
                    return message.reply('No channels are blacklisted in this server.');
                }
        
                let formattedChannels = '';
                blacklisted.forEach((channelId, index) => {
                    const channel = message.guild.channels.cache.get(channelId);
                    formattedChannels += `${index + 1}. ${channel ? channel.name : `Unknown`} (ID: ${channelId})\n`;
                });
        
                const embed = new EmbedBuilder()
                    .setTitle('Blacklisted Channels')
                    .setDescription(`\`\`\`${formattedChannels}\`\`\``)
                    .setFooter({ text: `Total blacklisted channels: ${blacklisted.length}` });
        
                message.channel.send({ embeds: [embed] });
            }
            // !!!!

            return; // Exit after handling a command
        }

        // Skip messages that contain ignored words
        if (!shouldTranslate(message.content)) {
            log('Message contains ignored words, skipping translation.');
            return;
        }

        const cleanedContent = cleanMessage(message.content);
        if (!cleanedContent) {
            log('Message is empty after cleaning, skipping.');
            return;
        }

        log(`Cleaned message content: ${cleanedContent}`);
        const detectedLang = langdetect.detectOne(cleanedContent);
        log(`Detected language: ${detectedLang}`);

        if (detectedLang === 'en') {
            log('Message is in English, skipping translation.');
            return;
        }

        const { translatedText, flagUrl, languageName } = await translateText(cleanedContent);
        log(`Translation result: ${translatedText}, Language: ${languageName}, Flag URL: ${flagUrl}`);

        if (translatedText) {
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
                .setDescription(`${translatedText}`)
                .setFooter({ text: `Original: ${message.content} | Language: ${languageName}` });

            if (flagUrl) {
                embed.setThumbnail(flagUrl);
            }

            await message.delete();
            await message.channel.send({ embeds: [embed] });
            log('Message translated and sent successfully.');
        }
    } catch (error) {
        log(`Error processing message: ${error.stack || error.message}`);
        console.error(error);
    }
});

function shouldTranslate(messageContent) {
    const words = messageContent.split(/\s+/);
    return !words.some(word => ignoreWords.includes(word.toLowerCase()));
}

async function translateText(text) {
    try {
        log(`Attempting to translate text: ${text}`);
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                q: text,
                source: "auto",
                target: "en",
                format: "text"
            }),
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error(`Translation API responded with status ${response.status}`);

        const data = await response.json();
        log(`API Response: ${JSON.stringify(data)}`);
        console.log(data);

        // Extract the confidence score
        const confidence = data.detectedLanguage?.confidence;
        log(`Detected confidence: ${confidence}`);

        // Skip translation if confidence is below 85%
        if (confidence !== undefined && confidence < 35) {
            log(`Translation skipped due to low confidence: ${confidence}`);
            return { translatedText: null, flagUrl: null, languageName: null };
        }

        const languageCode = data.detectedLanguage.language;

        const flagUrl = getFlagUrl(languageCode);
        const languageName = getLanguageName(languageCode);

        return { translatedText: data.translatedText, flagUrl, languageName };
    }
    catch (error) {
        log(`Translation error: ${error.stack || error.message}`);
        throw error; // Re-throw to be caught by the calling function
    }
}



process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection: ${reason.message || reason}`);
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

function getFlagUrl(languageCode) {
    const flagMap = {
        af: "https://flagcdn.com/w40/za.png", // Afrikaans (South Africa)
        ar: "https://flagcdn.com/w40/sa.png", // Arabic (Saudi Arabia)
        az: "https://flagcdn.com/w40/az.png", // Azerbaijani (Azerbaijan)
        be: "https://flagcdn.com/w40/by.png", // Belarusian (Belarus)
        bg: "https://flagcdn.com/w40/bg.png", // Bulgarian (Bulgaria)
        bn: "https://flagcdn.com/w40/bd.png", // Bengali (Bangladesh)
        cs: "https://flagcdn.com/w40/cz.png", // Czech (Czech Republic)
        da: "https://flagcdn.com/w40/dk.png", // Danish (Denmark)
        de: "https://flagcdn.com/w40/de.png", // German (Germany)
        el: "https://flagcdn.com/w40/gr.png", // Greek (Greece)
        es: "https://flagcdn.com/w40/es.png", // Spanish (Spain)
        et: "https://flagcdn.com/w40/ee.png", // Estonian (Estonia)
        fa: "https://flagcdn.com/w40/ir.png", // Persian (Iran)
        fi: "https://flagcdn.com/w40/fi.png", // Finnish (Finland)
        fr: "https://flagcdn.com/w40/fr.png", // French (France)
        he: "https://flagcdn.com/w40/il.png", // Hebrew (Israel)
        hi: "https://flagcdn.com/w40/in.png", // Hindi (India)
        hr: "https://flagcdn.com/w40/hr.png", // Croatian (Croatia)
        hu: "https://flagcdn.com/w40/hu.png", // Hungarian (Hungary)
        id: "https://flagcdn.com/w40/id.png", // Indonesian (Indonesia)
        it: "https://flagcdn.com/w40/it.png", // Italian (Italy)
        ja: "https://flagcdn.com/w40/jp.png", // Japanese (Japan)
        ka: "https://flagcdn.com/w40/ge.png", // Georgian (Georgia)
        kk: "https://flagcdn.com/w40/kz.png", // Kazakh (Kazakhstan)
        ko: "https://flagcdn.com/w40/kr.png", // Korean (South Korea)
        lt: "https://flagcdn.com/w40/lt.png", // Lithuanian (Lithuania)
        lv: "https://flagcdn.com/w40/lv.png", // Latvian (Latvia)
        mk: "https://flagcdn.com/w40/mk.png", // Macedonian (North Macedonia)
        mn: "https://flagcdn.com/w40/mn.png", // Mongolian (Mongolia)
        ms: "https://flagcdn.com/w40/my.png", // Malay (Malaysia)
        nb: "https://flagcdn.com/w40/no.png", // Norwegian (Norway)
        nl: "https://flagcdn.com/w40/nl.png", // Dutch (Netherlands)
        pl: "https://flagcdn.com/w40/pl.png", // Polish (Poland)
        pt: "https://flagcdn.com/w40/pt.png", // Portuguese (Portugal)
        ro: "https://flagcdn.com/w40/ro.png", // Romanian (Romania)
        ru: "https://flagcdn.com/w40/ru.png", // Russian (Russia)
        sk: "https://flagcdn.com/w40/sk.png", // Slovak (Slovakia)
        sl: "https://flagcdn.com/w40/si.png", // Slovenian (Slovenia)
        sq: "https://flagcdn.com/w40/al.png", // Albanian (Albania)
        sr: "https://flagcdn.com/w40/rs.png", // Serbian (Serbia)
        sv: "https://flagcdn.com/w40/se.png", // Swedish (Sweden)
        th: "https://flagcdn.com/w40/th.png", // Thai (Thailand)
        tr: "https://flagcdn.com/w40/tr.png", // Turkish (Turkey)
        uk: "https://flagcdn.com/w40/ua.png", // Ukrainian (Ukraine)
        vi: "https://flagcdn.com/w40/vn.png", // Vietnamese (Vietnam)
        zh: "https://flagcdn.com/w40/cn.png", // Chinese (China)
    };

    return flagMap[languageCode] || null;
}

function getLanguageName(languageCode) {
    const languageMap = {
        af: "Afrikaans",
        ar: "Arabic",
        az: "Azerbaijani",
        be: "Belarusian",
        bg: "Bulgarian",
        bn: "Bengali",
        cs: "Czech",
        da: "Danish",
        de: "German",
        el: "Greek",
        es: "Spanish",
        et: "Estonian",
        fa: "Persian",
        fi: "Finnish",
        fr: "French",
        he: "Hebrew",
        hi: "Hindi",
        hr: "Croatian",
        hu: "Hungarian",
        id: "Indonesian",
        it: "Italian",
        ja: "Japanese",
        ka: "Georgian",
        kk: "Kazakh",
        ko: "Korean",
        lt: "Lithuanian",
        lv: "Latvian",
        mk: "Macedonian",
        mn: "Mongolian",
        ms: "Malay",
        nb: "Norwegian",
        nl: "Dutch",
        pl: "Polish",
        pt: "Portuguese",
        ro: "Romanian",
        ru: "Russian",
        sk: "Slovak",
        sl: "Slovenian",
        sq: "Albanian",
        sr: "Serbian",
        sv: "Swedish",
        th: "Thai",
        tr: "Turkish",
        uk: "Ukrainian",
        vi: "Vietnamese",
        zh: "Chinese",
    };

    return languageMap[languageCode] || "Unknown Language";
}

client.login(process.env.BOT_TOKEN);
