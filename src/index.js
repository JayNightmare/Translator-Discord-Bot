const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const { DISCORD_TOKEN } = require('./config/config.js');
const { log } = require('./utils/utils-logger.js');
const { connectToDatabase } = require('./utils/utils-database.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
    ],
    partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

client.commands = new Collection();

try {
    log(`// ############################## //`);
    const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
        log(`Loaded command: ${command.name}`);
    }

    log(`>> Preparing to load all events`);
    const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
    log(`>> Found ${eventFiles.length} events to load`);
    for (const file of eventFiles) {
        log(`>> Loading event file: ${file}`);
        const event = require(`./events/${file}`);
        log(`Loaded event: ${event.name}`);
        if (event.once) {
            log(`>> Registering one-time event: ${event.name}`);
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            log(`>> Registering recurring event: ${event.name}`);
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
    connectToDatabase();
} catch (error) {
    log(`(error #%d) Error occured during start up ${error}`);
    log(`// ############################## //`);
    console.error(`(error #%d) Error occured during start up ${error}`)
}

client.login(DISCORD_TOKEN);