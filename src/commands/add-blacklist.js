const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const Blacklist = require("../models/Blacklist");
const languageMap = require('../utils/languageMap');

module.exports = {
    name: 'blacklist-add',
    data: new SlashCommandBuilder()
        .setName('blacklist-add')
        .setDescription('Manage blacklists for the server')
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
                .setDescription('Comma-separated list of items to blacklist')
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
                blacklist = new Blacklist({ serverId });
            }

            // Convert language names to codes using languageMap
            const normalizedLanguages = items.map(item => languageMap[item.toLowerCase()] || item);

            switch (type) {
                case 'words':
                    blacklist.blacklistedWords = [
                        ...(blacklist.blacklistedWords || []),
                        ...items.filter(item => !(blacklist.blacklistedWords || []).includes(item))
                    ];
                    break;
                case 'channels':
                    blacklist.blacklistedChannels = [
                        ...(blacklist.blacklistedChannels || []),
                        ...items.filter(item => !(blacklist.blacklistedChannels || []).includes(item))
                    ];
                    break;
                case 'roles':
                    blacklist.blacklistedRoles = [
                        ...(blacklist.blacklistedRoles || []),
                        ...items.filter(item => !(blacklist.blacklistedRoles || []).includes(item))
                    ];
                    break;
                case 'languages':
                    blacklist.blacklistedLanguages = [
                        ...(blacklist.blacklistedLanguages || []),
                        ...normalizedLanguages.filter(item => !(blacklist.blacklistedLanguages || []).includes(item))
                    ];
                    break;
                default:
                    return interaction.reply({ content: 'Invalid blacklist type.', flags: MessageFlags.Ephemeral });
            }

            await blacklist.save();

            interaction.reply({
                content: `Successfully updated the ${type} blacklist.`,
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
};
