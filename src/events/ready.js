const { REST, Routes, ActivityType } = require('discord.js');
const { DISCORD_TOKEN } = require('../config/config.js');
const fs = require('fs');
const Server = require('../models/Server.js');
const { log } = require('../utils/utils-logger.js');

module.exports = {
    name: 'ready',
    async execute(client) {
        log(`Logged in as ${client.user.tag}`);

        client.user.setActivity('Server Mode', { type: ActivityType.Watching });
        client.user.setStatus('dnd');

        if (!DISCORD_TOKEN) {
            console.error("❌ DISCORD_TOKEN is missing! Check your .env file.");
            process.exit(1);
        }

        const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
        const commands = [];

        // Load all command files
        const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            commands.push(command.data.toJSON());
        }

        try {
            log('Started refreshing application (/) commands.');

            // Fetch all guilds the bot is in
            const guilds = await client.guilds.fetch();

            for (const guild of guilds.values()) {
                const serverId = guild.id;

                try {
                    const fullGuild = await guild.fetch();
                    const memberCount = fullGuild.memberCount;
                    const ownerId = fullGuild.ownerId;
                    log(`>> Server ${guild.name} (${serverId}) has ${memberCount} members and is owned by ${ownerId}.`);

                    let server = await Server.findOne({ serverId });

                    if (!server) {
                        server = await Server.create({
                            serverId,
                            name: fullGuild.name,
                            memberCount,
                            ownerId
                        });
                        log(`Added server ${guild.name} (${serverId}) to the database.`);
                    } else {
                        log(`Server ${guild.name} (${serverId}) already exists in the database.`);
                        await Server.updateOne({ serverId }, {
                            name: fullGuild.name,
                            memberCount,
                            ownerId
                        });
                    }

                    // Register slash commands for the guild
                    await rest.put(
                        Routes.applicationGuildCommands(client.user.id, serverId),
                        { body: commands }
                    );

                    log(`Successfully registered commands for guild: ${serverId}`);
                } catch (error) {
                    console.error(`Error registering commands or adding server ${serverId}:`, error);
                }
            }

            log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error('Error fetching guilds:', error);
        }
    },
};
