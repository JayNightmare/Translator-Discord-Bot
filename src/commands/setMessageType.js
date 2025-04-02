const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const Settings = require("../models/Settings");

module.exports = {
    name: 'setmessagetype',
    data: new SlashCommandBuilder()
        .setName('setmessagetype')
        .setDescription('Set how the translated message is sent')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The message type')
                .setRequired(true)
                .addChoices(
                    { name: 'Embed Expanded', value: 'embed_expanded' },
                    { name: 'Embed Minimal', value: 'embed_minimal' },
                    { name: 'Text Expanded', value: 'text_expanded' },
                    { name: 'Text Minimal', value: 'text_minimal' }
                )
        ),
    async execute(interaction) {
        const messageType = interaction.options.getString('type');
        const serverId = interaction.guild.id;

        try {
            // Get or create settings entry for this server
            let settings = await Settings.findOne({ serverId });
            if (!settings) {
                settings = new Settings({ serverId });
            }

            // Update message type
            settings.messageType = messageType;
            await settings.save();

            interaction.reply({
                content: `Message type updated to: ${messageType.replace('_', ' ')}`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error updating message type:', error);
            interaction.reply({
                content: 'An error occurred while updating the message type.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}
