import { Client, GatewayIntentBits } from 'discord.js';
import mongoose from 'mongoose';
import { BOT_TOKEN } from './config/config.js';
import { log } from './utils/logger.js';
import { onReady } from './events/ready.js';
import { onInteractionCreate } from './events/interactionCreate.js';
import { onMessageCreate } from './events/messageCreate.js';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

mongoose.connect('mongodb://localhost:27017/yourdb', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => log('Connected to MongoDB'))
    .catch(error => log(`MongoDB connection error: ${error.message}`));

client.on('ready', () => onReady(client));
client.on('interactionCreate', onInteractionCreate);
client.on('messageCreate', onMessageCreate);

client.login(BOT_TOKEN);
