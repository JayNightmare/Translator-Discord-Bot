const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const Blacklist = require("../models/Blacklist");
const languageMap = require('../utils/languageMap');

module.exports = {
    name: 'blacklist-list',
    data: new SlashCommandBuilder()
        .setName('blacklist-list')
        .setDescription('List items in the blacklist for the server')
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
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        const type = interaction.options.getString('type');
        const serverId = interaction.guild.id;

        const blacklist = await Blacklist.findOne({ serverId });

        if (!blacklist || !blacklist[`blacklisted${type.charAt(0).toUpperCase() + type.slice(1)}`]?.length) {
            return interaction.reply({ content: `No items found in the blacklist for type: ${type}.`, flags: MessageFlags.Ephemeral });
        }

        const blacklistItems = blacklist[`blacklisted${type.charAt(0).toUpperCase() + type.slice(1)}`];

        let currentPage = 0;
        const itemsPerPage = 10;
        const totalPages = Math.ceil(blacklistItems.length / itemsPerPage);

        const generateEmbed = (page) => {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const items = blacklistItems.slice(start, end);

            const formattedItems = items.map((item, index) => {
                if (type === 'channels') {
                    return `${start + index + 1}. ${item.startsWith('<#') && item.endsWith('>') ? item : `<#${item}>`}`;
                } else if (type === 'roles') {
                    return `${start + index + 1}. ${item.startsWith('<@&') && item.endsWith('>') ? item : `<@&${item}>`}`;
                } else {
                    return `${start + index + 1}. ${item}`;
                }
            });

            const embed = new EmbedBuilder()
                .setTitle(`Blacklist - ${type}`)
                .setDescription(formattedItems.join('\n'))
                .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

            return embed;
        };

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === totalPages - 1)
            );

        await interaction.reply({
            embeds: [generateEmbed(currentPage)],
            components: [row]
        });

        const message = await interaction.fetchReply();

        const collector = message.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.user.id !== interaction.user.id) {
                return buttonInteraction.reply({ content: 'You cannot interact with this button.', flags: MessageFlags.Ephemeral });
            }

            if (buttonInteraction.customId === 'previous') {
                currentPage--;
            } else if (buttonInteraction.customId === 'next') {
                currentPage++;
            }

            await buttonInteraction.update({
                embeds: [generateEmbed(currentPage)],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('previous')
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentPage === 0),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentPage === totalPages - 1)
                        )
                ]
            });
        });

        collector.on('end', () => {
            message.edit({ components: [] });
        });
    }
};
