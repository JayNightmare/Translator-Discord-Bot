const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const Settings = require("../models/Settings");

module.exports = {
    name: 'set-auto-translate',
    data: new SlashCommandBuilder()
        .setName('set-auto-translate')
        .setDescription('Enable or disable auto-translation for the server')
        .addBooleanOption(option =>
            option.setName('enabled')
                .setDescription('Enable or disable auto-translation')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const autoTranslate = interaction.options.getBoolean('enabled');
        const serverId = interaction.guild.id;

        try {
            // Get or create settings entry for this server
            let settings = await Settings.findOne({ serverId });
            if (!settings) {
                settings = new Settings({ serverId });
            }

            // Update auto-translate setting
            settings.autoTranslate = autoTranslate;
            await settings.save();

            interaction.reply({
                content: `Auto-translation has been ${autoTranslate ? 'enabled' : 'disabled'} for this server.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error updating auto-translate setting:', error);
            interaction.reply({
                content: 'An error occurred while updating the auto-translate setting.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};