// src/events/ready.js
const { Client, PermissionsBitField, SlashCommandBuilder, ChannelType, GatewayIntentBits, REST, Routes, Events, ActivityType } = require('discord.js');
const { DISCORD_TOKEN } = require('../configs/config');

const fs = require('fs');

module.exports = {
    name: 'ready',
    run: 'once',
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}`);

        client.user.setActivity('Server Mode', { type: ActivityType.Watching });
        client.user.setStatus('dnd');

        const commands = [];
        const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            commands.push(command.data.toJSON());
        }

        const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

        try {
            // Fetch all guilds (servers) the bot is in
            const guilds = await client.guilds.fetch();
    
            // Log an event for each server the bot is in
            guilds.forEach(async (guild) => {
                const serverId = guild.id;
    
                try {
                    // Check if the server exists in the database
                    let server = await Server.findOne({ where: { serverId } });
                    
                    if (!server) {
                        // If not, create a new entry for the server
                        server = await Server.create({ serverId });
                        console.log(`Added server ${guild.name} (${serverId}) to the database.`);
                    } else {
                        console.log(`Server ${guild.name} (${serverId}) already exists in the database.`);
                    }
    
                    // Register commands for the guild
                    await rest.put(
                        Routes.applicationGuildCommands(client.user.id, serverId),
                        { body: commands }
                    );
    
                } catch (error) {
                    console.error(`Error registering commands or adding server ${guild.name} (${serverId}) to the database:`, error);
                }
            });
    
            console.log('All servers initialized in the database.');
            console.log('Successfully registered application (/) commands.');
    
        } catch (error) {
            console.error('Error fetching guilds:', error);
        }
    },
};
