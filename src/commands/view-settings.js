const { PermissionFlagsBits, MessageFlags, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { getServerSettings, getBlacklist, getIgnoredWords } = require('../utils/utils-fetchData');

module.exports = {
    name: 'view-settings',
    data: new SlashCommandBuilder()
        .setName('view-settings')
        .setDescription('Displays the server settings from the database.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        try {
            const guildId = interaction.guild.id;

            // Fetch server settings from the database
            const settings = await getServerSettings(guildId);
            const blacklist = await getBlacklist(guildId);
            const ignoredWords = await getIgnoredWords(guildId);

            if (!settings) {
                return interaction.reply('No settings found for this server.');
            }

            // * Remove _ from message type
            const messageType = settings.messageType.replace(/_/g, ' ');

            // Create the initial embed for general server settings
            const settingsEmbed = new EmbedBuilder()
                .setTitle('Server Settings')
                .setDescription('Select a category below to view specific settings.')
                .addFields(
                    { name: 'Language To', value: settings.languageTo || 'Not set', inline: true },
                    { name: 'Language From', value: settings.languageFrom || 'Not set', inline: true },
                    { name: 'Logging Channel', value: `<#${settings.loggingChannelId}>` || 'Not set', inline: false },
                    { name: 'Message Type', value: messageType || 'Not set', inline: true },
                    { name: 'Auto Translate', value: settings.autoTranslate ? 'Enabled' : 'Disabled', inline: true },
                );

            // Create the select menu for categories
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('settings-category')
                .setPlaceholder('Choose a category')
                .addOptions([
                    { label: 'General Settings', value: 'general' },
                    { label: 'Blacklist', value: 'blacklist' },
                    { label: 'Ignored Words', value: 'ignored_words' },
                ]);

            const actionRow = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({ embeds: [settingsEmbed], components: [actionRow] });

            // Create a collector to handle select menu interactions
            const collector = interaction.channel.createMessageComponentCollector({
                componentType: 'SELECT_MENU',
                time: 60000, // 1 minute
            });

            collector.on('collect', async (menuInteraction) => {
                if (menuInteraction.customId === 'settings-category') {
                    const selectedCategory = menuInteraction.values[0];

                    if (selectedCategory === 'general') {
                        await menuInteraction.update({ embeds: [settingsEmbed], components: [actionRow] });
                    } else if (selectedCategory === 'blacklist') {
                        const blacklistEmbed = new EmbedBuilder()
                            .setTitle('Blacklist')
                            .addFields(
                                { name: 'Languages', value: blacklist.languages.join(', ') || 'None' },
                                { name: 'Roles', value: blacklist.roles.join(', ') || 'None' },
                                { name: 'Words', value: blacklist.words.join(', ') || 'None' },
                                { name: 'Channels', value: blacklist.channels.join(', ') || 'None' }
                            );

                        await menuInteraction.update({ embeds: [blacklistEmbed], components: [actionRow] });
                    } else if (selectedCategory === 'ignored_words') {
                        const ignoredWordsEmbed = new EmbedBuilder()
                            .setTitle('Ignored Words')
                            .setDescription(ignoredWords.length > 0 ? ignoredWords.join('\n') : 'No ignored words.');

                        const prevButton = new ButtonBuilder()
                            .setCustomId('prev_page')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true);

                        const nextButton = new ButtonBuilder()
                            .setCustomId('next_page')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(ignoredWords.length <= 10);

                        const buttonRow = new ActionRowBuilder().addComponents(prevButton, nextButton);

                        await menuInteraction.update({ embeds: [ignoredWordsEmbed], components: [actionRow, buttonRow] });
                    }
                }
            });

            collector.on('end', () => {
                // Disable components after the collector ends
                actionRow.components.forEach((component) => component.setDisabled(true));
                interaction.editReply({ components: [actionRow] });
            });
        } catch (error) {
            console.error('Error fetching server settings:', error);
            await interaction.reply({
                content: 'There was an error retrieving the server settings.',
                flags: MessageFlags.Ephemeral});
        }
    },
};