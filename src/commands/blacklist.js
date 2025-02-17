const { SlashCommandBuilder } = require("discord.js");
const Blacklist = require("../models/Blacklist");

module.exports = {
    name: 'blacklist',
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Blacklist one or more channels from translation')
        .addChannelOption(option =>
            option.setName('channels')
                .setDescription('The channels to blacklist')
                .setRequired(true)
        ),
    async execute(interaction) {
        const channels = interaction.options.getChannel('channels', true);
        const serverId = interaction.guild.id;

        // Ensure all provided channels are text channels
        const invalidChannels = channels.filter(ch => ch.type !== 0);
        if (invalidChannels.length > 0) {
            return interaction.reply({
                content: 'Please select only text channels.',
                ephemeral: true
            });
        }

        try {
            // Get or create blacklist entry for this server
            let blacklist = await Blacklist.findOne({ serverId });
            if (!blacklist) {
                blacklist = new Blacklist({ serverId });
            }

            // Add new channels to blacklist, avoiding duplicates
            const channelIds = channels.map(ch => ch.id);
            const uniqueChannels = [...new Set([
                ...(blacklist.blacklistedChannels || []),
                ...channelIds
            ])];

            blacklist.blacklistedChannels = uniqueChannels;
            await blacklist.save();

            interaction.reply({
                content: `Successfully blacklisted ${channels.length} channel(s) from translation.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error updating blacklist:', error);
            interaction.reply({
                content: 'An error occurred while updating the blacklist.',
                ephemeral: true
            });
        }
    }
}
