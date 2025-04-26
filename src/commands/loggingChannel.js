const { PermissionFlagsBits, SlashCommandBuilder, MessageFlags } = require("discord.js");
const Server = require("../models/Server");
const Settings = require("../models/Settings");

module.exports= {
    name: 'log-channel',
    data: new SlashCommandBuilder()
        .setName('log-channel')
        .setDescription('Set the log channel for the server')
        .addChannelOption(option =>
            option.setName('channel')
            .setDescription('The channel to set as the log channel')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        if (channel.type !== 0) {
            return interaction.reply({ content: 'Please select a text channel.', flags: MessageFlags.Ephemeral });
        }

        const serverId = interaction.guildId;

        try {
            const server = await Server.findOne({ serverId: `${serverId}` });

            console.log('Server in database:', server);
            console.log('Server ID:', serverId);

            if (!server) {
                return interaction.reply({ content: 'Server not found in the database.', flags: MessageFlags.Ephemeral });
            }

            server.logChannelId = channel.id;
            await server.save();

            // Update the loggingChannelId in the Settings table
            let settings = await Settings.findOne({ serverId });
            if (!settings) {
                settings = new Settings({
                    serverId: serverId,
                    allowedChannels: [],
                    loggingChannelId: channel.id,
                    languageTo: 'english',
                    languageFrom: null,
                });
            }
            settings.loggingChannelId = channel.id;
            await settings.save();

            interaction.reply({ content: `Log channel set to <#${channel.id}>`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error setting log channel:', error);
            interaction.reply({ content: 'An error occurred while setting the log channel.', flags: MessageFlags.Ephemeral });
        }
    }
}