const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const { log } = require('../utils/utils-logger.js');

const { ensureServerData, ensureUserData } = require('../utils/utils-ensureData.js');

module.exports = {
    name: 'guildCreate',
    async execute(guild) {
        const serverId = guild.id;
        const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
        client.commands = new Collection();

        try {
            console.log(`>> Prep for fetching members from server`);
            // Fetch all members of the guild
            await guild.members.fetch(); // Ensure members are cached

            console.log(`>> Ensuring Data`);
            // Ensure server data is initialized
            await ensureServerData(serverId, guild);

            console.log(`>> Fetching all members in the server`);
            // Loop through each member in the guild
            guild.members.cache.forEach(async (member) => {
                const userId = member.id;

                // Ensure the user data exists for this user
                await ensureUserData(serverId, userId);
            });
            
            console.log(`>> Preparing to load all commands`);
            // Load commands dynamically
            const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`./commands/${file}`);
                client.commands.set(command.name, command);
                log(`Loaded command: ${command.name}`);
            }
            
            console.log(`>> Preparing to load all events`);
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

            console.log(`>> Storing owner and member information`);
            // Store owner and member information in the database
            const ownerId = guild.ownerId;
            const memberCount = guild.memberCount;

            console.log(`>> Saving Server Data`);
            await saveOwnerData(serverId, ownerId, memberCount);
        } catch (err) {
            console.error(`(error #%d) Error occured when rendering a new server: `, err);
        }

        
    }
}