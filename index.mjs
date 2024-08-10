import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import langdetect from 'langdetect';

import fs from 'fs';
const ignoreWordsPath = './ignoreWords.json';
let ignoreWords = [];

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const API_URL = process.env.API_URL;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Load existing ignore words from file
if (fs.existsSync(ignoreWordsPath)) {
    const data = fs.readFileSync(ignoreWordsPath);
    ignoreWords = JSON.parse(data);
}

function saveIgnoreWords() {
    fs.writeFileSync(ignoreWordsPath, JSON.stringify(ignoreWords, null, 2));
}

function cleanMessage(content) {
    // Remove custom Discord emotes, text-based emotes, and Unicode emojis
    return content
        .replace(/<:[a-zA-Z0-9_]+:[0-9]+>/g, '')  // Remove custom emotes like <:emote:123456>
        .replace(/:[a-zA-Z0-9_]+:/g, '')          // Remove text-based emotes like :DanceLizard:
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '')   // Remove standard Unicode emojis
        .trim();
}


client.on('messageCreate', (message) => {
    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
        return message.reply('You do not have permission to use this command.');
    }

    else if (message.member.permissions.has('MANAGE_MESSAGES')) {
        client.on('messageCreate', (message) => {
            if (message.content === 'tb!view') {
                message.reply(`Ignore list: ${ignoreWords.join(', ')}`);
            }
        });

        if (message.content.startsWith('tb!rm')) {
            const word = message.content.split(' ')[1];
            ignoreWords = ignoreWords.filter(w => w !== word.toLowerCase());
            saveIgnoreWords(); // Save updated list to file
            message.reply(`Removed "${word}" from the ignore list.`);
        }

        if (message.content.startsWith('tb!addi')) {
            const word = message.content.split(' ')[1];
            if (word && !ignoreWords.includes(word.toLowerCase())) {
                ignoreWords.push(word.toLowerCase());
                saveIgnoreWords(); // Save updated list to file
                message.reply(`Added "${word}" to the ignore list.`);
            } else {
                message.reply(`${word ? `"${word}" is already in the ignore list.` : "Please specify a word to add."}`);
            }
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !shouldTranslate(message.content)) return;

    const cleanedContent = cleanMessage(message.content);

    // Skip processing if the message is empty after cleaning
    if (!cleanedContent) return;

    const detectedLang = langdetect.detectOne(cleanedContent);
    console.log("Detected Language Code:", detectedLang);

    if (detectedLang === 'en') {
        console.log('Message is in English, skipping translation.');
        return;
    }

    const { translatedText, flagUrl, languageName } = await translateText(cleanedContent);

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
    }
});

function shouldTranslate(messageContent) {
    const words = messageContent.split(/\s+/);
    return !words.some(word => ignoreWords.includes(word.toLowerCase()));
}

async function translateText(text) {
    try {
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

        const data = await response.json();
        console.log("API Response:", data);

        const languageCode = data.detectedLanguage.language; 

        const flagUrl = getFlagUrl(languageCode);
        const languageName = getLanguageName(languageCode);

        return { translatedText: data.translatedText, flagUrl, languageName };
    } catch (error) {
        console.error('Translation error:', error);
        return { translatedText: null, flagUrl: null, languageName: null };
    }
}

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
