const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const Blacklist = require("../models/Blacklist");
const languageMap = require('../utils/languageMap');

module.exports = {
    name: 'blacklist-remove',
    data: new SlashCommandBuilder()
        .setName('blacklist-remove')
        .setDescription('Remove items from the blacklist for the server')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of blacklist to modify')
                .setRequired(true)
                .addChoices(
                    { name: 'Words', value: 'words' },
                    { name: 'Channels', value: 'channels' },
                    { name: 'Roles', value: 'roles' },
                    { name: 'Languages', value: 'languages' }
                )
        )
        .addStringOption(option =>
            option.setName('items')
                .setDescription('Comma-separated list of items to remove from the blacklist')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const type = interaction.options.getString('type');
        const items = interaction.options.getString('items').split(',').map(item => item.trim());
        const serverId = interaction.guild.id;

        try {
            let blacklist = await Blacklist.findOne({ serverId });
            if (!blacklist) {
                return interaction.reply({ content: 'No blacklist found for this server.', flags: MessageFlags.Ephemeral });
            }

            // Convert language names to codes using languageMap
            const normalizedLanguages = items.map(item => languageMap[item.toLowerCase()] || item);

            switch (type) {
                case 'words':
                    blacklist.blacklistedWords = (blacklist.blacklistedWords || []).filter(word => !items.includes(word));
                    break;
                case 'channels':
                    blacklist.blacklistedChannels = (blacklist.blacklistedChannels || []).filter(channel => !items.includes(channel));
                    break;
                case 'roles':
                    blacklist.blacklistedRoles = (blacklist.blacklistedRoles || []).filter(role => !items.includes(role));
                    break;
                case 'languages':
                    blacklist.blacklistedLanguages = (blacklist.blacklistedLanguages || []).filter(language => !normalizedLanguages.includes(language));
                    break;
                default:
                    return interaction.reply({ content: 'Invalid blacklist type.', flags: MessageFlags.Ephemeral });
            }

            await blacklist.save();

            interaction.reply({
                content: `Successfully removed the specified items from the ${type} blacklist.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error updating blacklist:', error);
            interaction.reply({
                content: 'An error occurred while updating the blacklist.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}