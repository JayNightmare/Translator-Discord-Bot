const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const Settings = require("../models/Settings");

module.exports = {
    name: 'setlanguage',
    data: new SlashCommandBuilder()
        .setName('setlanguage')
        .setDescription('Set the server\'s translation languages')
        .addStringOption(option =>
            option.setName('language_to')
                .setDescription('The language to translate to')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('language_from')
                .setDescription('The language to translate from (default: auto detect)')
                .setRequired(false)
        ),
    async execute(interaction) {
        const languageTo = interaction.options.getString('language_to');
        const languageFrom = interaction.options.getString('language_from') || 'auto';
        const serverId = interaction.guild.id;

        try {
            // Get or create settings entry for this server
            let settings = await Settings.findOne({ serverId });
            if (!settings) {
                settings = new Settings({ serverId });
            }

            // Update language settings
            settings.languageTo = languageTo;
            settings.languageFrom = languageFrom;
            await settings.save();

            interaction.reply({
                content: `Language settings updated:\n` +
                         `Translate from: ${languageFrom}\n` +
                         `Translate to: ${languageTo}`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error updating language settings:', error);
            interaction.reply({
                content: 'An error occurred while updating language settings.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}
