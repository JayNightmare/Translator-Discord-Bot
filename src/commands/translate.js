const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { translateText } = require("../services/translateServices");

module.exports = {
    name: 'translate',
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Translate a message to a specified language')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to translate')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('target_language')
                .setDescription('The language to translate the message into (e.g., en, es, fr)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('source_language')
                .setDescription('Original language of message (incase detecting fails)')
                .setRequired(false)
        ),
    async execute(interaction) {
        const message = interaction.options.getString('message');
        const targetLanguage = interaction.options.getString('target_language');
        const sourceLanguage = interaction.options.getString('source_language') || null;
        const serverId = interaction.guild.id;

        try {
            const result = await translateText(message, serverId, targetLanguage, sourceLanguage);

            if (result.translatedText) {
                interaction.reply({
                    content: `Translated message: ${result.translatedText}`,
                    flags: MessageFlags.Ephemeral
                });
            } else {
                interaction.reply({
                    content: 'Translation could not be completed.',
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (error) {
            console.error('Error during manual translation:', error);
            interaction.reply({
                content: 'An error occurred while translating the message.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};