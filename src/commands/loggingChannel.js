const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const Server = require("../models/Server");

module.exports= {
    name: 'log-channel',
    data: new SlashCommandBuilder()
    .setName('log-channel')
    .setDescription('Set the log channel for the server')
    .addChannelOption(option =>
        option.setName('channel')
        .setDescription('The channel to set as the log channel')
        .setRequired(true)
    ),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        if (channel.type !== 0) {
            return interaction.reply({ content: 'Please select a text channel.', flags: MessageFlags.Ephemeral });
        }

        const serverId = interaction.serverId;

        try {
            const server = await Server.findOne({ where: { serverId } });

            if (!server) {
                return interaction.reply({ content: 'Server not found in the database.', flags: MessageFlags.Ephemeral });
            }

            server.logChannelId = channel.id;
            await server.save();

            interaction.reply({ content: `Log channel set to <#${channel.id}>`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error setting log channel:', error);
            interaction.reply({ content: 'An error occurred while setting the log channel.', flags: MessageFlags.Ephemeral });
        }
    }
}