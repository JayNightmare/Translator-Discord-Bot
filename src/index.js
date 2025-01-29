import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import { BOT_TOKEN } from './config/config.js';
import { log } from './utils/logger.js';
import { connectToDatabase } from './utils/utils-database.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();

// Load commands dynamically
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    log(`Loaded command: ${command.name}`);
}

// Load events dynamically 
const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

connectToDatabase();

client.login(BOT_TOKEN);