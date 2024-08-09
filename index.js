require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const API_URL = process.env.API_URL;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

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

        if (languageCode === 'en') {
            // If the message is already in English, skip translation
            console.log('Message is already in English, skipping translation.');
            return { translatedText: null, flagUrl: null };
        }

        const flagUrl = getFlagUrl(languageCode);
        const languageName = getLanguageName(languageCode);

        return { translatedText: data.translatedText, flagUrl, languageName };
    } catch (error) {
        console.error('Translation error:', error);
        return { translatedText: null, flagUrl: null, languageName: null };
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const { translatedText, flagUrl, languageName } = await translateText(message.content);

    if (translatedText) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
            .setDescription(`**${message.author.username} said:** ${translatedText}`)
            .setFooter({ text: `Original: ${message.content} | Language: ${languageName}` });

        if (flagUrl) {
            embed.setThumbnail(flagUrl);
        }

        await message.delete();
        await message.channel.send({ embeds: [embed] });
    }
});

function getFlagUrl(languageCode) {
    const flagMap = {
        af: "https://flagcdn.com/w40/af.png", // Afghanistan
        ar: "https://flagcdn.com/w40/ar.png", // Argentina
        au: "https://flagcdn.com/w40/au.png", // Australia
        br: "https://flagcdn.com/w40/br.png", // Brazil
        ca: "https://flagcdn.com/w40/ca.png", // Canada
        cn: "https://flagcdn.com/w40/cn.png", // China
        de: "https://flagcdn.com/w40/de.png", // Germany
        eg: "https://flagcdn.com/w40/eg.png", // Egypt
        es: "https://flagcdn.com/w40/es.png", // Spain
        fr: "https://flagcdn.com/w40/fr.png", // France
        gb: "https://flagcdn.com/w40/gb.png", // United Kingdom
        gr: "https://flagcdn.com/w40/gr.png", // Greece
        hk: "https://flagcdn.com/w40/hk.png", // Hong Kong
        id: "https://flagcdn.com/w40/id.png", // Indonesia
        il: "https://flagcdn.com/w40/il.png", // Israel
        in: "https://flagcdn.com/w40/in.png", // India
        it: "https://flagcdn.com/w40/it.png", // Italy
        jp: "https://flagcdn.com/w40/jp.png", // Japan
        kr: "https://flagcdn.com/w40/kr.png", // South Korea
        mx: "https://flagcdn.com/w40/mx.png", // Mexico
        ng: "https://flagcdn.com/w40/ng.png", // Nigeria
        nl: "https://flagcdn.com/w40/nl.png", // Netherlands
        no: "https://flagcdn.com/w40/no.png", // Norway
        nz: "https://flagcdn.com/w40/nz.png", // New Zealand
        pk: "https://flagcdn.com/w40/pk.png", // Pakistan
        pl: "https://flagcdn.com/w40/pl.png", // Poland
        pt: "https://flagcdn.com/w40/pt.png", // Portugal
        ro: "https://flagcdn.com/w40/ro.png", // Romania
        ru: "https://flagcdn.com/w40/ru.png", // Russia
        sa: "https://flagcdn.com/w40/sa.png", // Saudi Arabia
        se: "https://flagcdn.com/w40/se.png", // Sweden
        sg: "https://flagcdn.com/w40/sg.png", // Singapore
        tr: "https://flagcdn.com/w40/tr.png", // Turkey
        tw: "https://flagcdn.com/w40/tw.png", // Taiwan
        ua: "https://flagcdn.com/w40/ua.png", // Ukraine
        us: "https://flagcdn.com/w40/us.png", // United States
        vn: "https://flagcdn.com/w40/vn.png", // Vietnam
        za: "https://flagcdn.com/w40/za.png", // South Africa
        be: "https://flagcdn.com/w40/be.png", // Belgium
        ch: "https://flagcdn.com/w40/ch.png", // Switzerland
        dk: "https://flagcdn.com/w40/dk.png", // Denmark
        fi: "https://flagcdn.com/w40/fi.png", // Finland
        hu: "https://flagcdn.com/w40/hu.png", // Hungary
        ie: "https://flagcdn.com/w40/ie.png", // Ireland
        ke: "https://flagcdn.com/w40/ke.png", // Kenya
        my: "https://flagcdn.com/w40/my.png", // Malaysia
        th: "https://flagcdn.com/w40/th.png", // Thailand
        ve: "https://flagcdn.com/w40/ve.png", // Venezuela
    };

    return flagMap[languageCode] || null;
}


function getLanguageName(languageCode) {
    const languageMap = {
        af: "Afrikaans",
        ar: "Arabic",
        au: "English (Australia)",
        br: "Portuguese (Brazil)",
        ca: "English (Canada)",
        cn: "Chinese",
        de: "German",
        eg: "Arabic (Egypt)",
        es: "Spanish",
        fr: "French",
        gb: "English (UK)",
        gr: "Greek",
        hk: "Chinese (Hong Kong)",
        id: "Indonesian",
        il: "Hebrew",
        in: "Hindi",
        it: "Italian",
        jp: "Japanese",
        kr: "Korean",
        mx: "Spanish (Mexico)",
        ng: "English (Nigeria)",
        nl: "Dutch",
        no: "Norwegian",
        nz: "English (New Zealand)",
        pk: "Urdu",
        pl: "Polish",
        pt: "Portuguese",
        ro: "Romanian",
        ru: "Russian",
        sa: "Arabic (Saudi Arabia)",
        se: "Swedish",
        sg: "English (Singapore)",
        tr: "Turkish",
        tw: "Chinese (Taiwan)",
        ua: "Ukrainian",
        us: "English (US)",
        vn: "Vietnamese",
        za: "Afrikaans (South Africa)",
        be: "Dutch (Belgium)",
        ch: "German (Switzerland)",
        dk: "Danish",
        fi: "Finnish",
        hu: "Hungarian",
        ie: "English (Ireland)",
        ke: "English (Kenya)",
        my: "Malay",
        th: "Thai",
        ve: "Spanish (Venezuela)",
    };

    return languageMap[languageCode] || "Unknown Language";
}


client.login(process.env.BOT_TOKEN);