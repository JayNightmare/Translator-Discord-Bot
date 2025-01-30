const { SlashCommandBuilder } = require("discord.js");
const Server = require("../models/Server");

module.exports= {
    data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Set the log channel for the server')
    // ! Add Choice for either channel or item input
    ,
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        if (channel.type !== 0) {
            return interaction.reply({ content: 'Please select a text channel.', ephemeral: true });
        }

        const serverId = interaction.serverId;

        try {
            const server = await Server.findOne({ where: { serverId } });

            if (!server) {
                return interaction.reply({ content: 'Server not found in the database.', ephemeral: true });
            }

            server.logChannelId = channel.id;
            await server.save();

            interaction.reply({ content: `Log channel set to <#${channel.id}>`, ephemeral: true });
        } catch (error) {
            console.error('Error setting log channel:', error);
            interaction.reply({ content: 'An error occurred while setting the log channel.', ephemeral: true });
        }
    }
}