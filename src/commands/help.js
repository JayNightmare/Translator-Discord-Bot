const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

// Command categories
const categories = {
    translation: {
        name: '🌐 Translation',
        description: 'Commands for translation functionality',
        commands: ['translate', 'language-codes', 'set-language', 'set-auto-translate'],
        color: '#3498db'
    },
    blacklist: {
        name: '⛔ Blacklist Management',
        description: 'Manage language blacklist settings',
        commands: ['add-blacklist', 'list-blacklist', 'remove-blacklist'],
        color: '#e74c3c'
    },
    settings: {
        name: '⚙️ Server Settings',
        description: 'Configure server-specific settings',
        commands: ['log-channel', 'set-message-type', 'view-settings'],
        color: '#2ecc71'
    }
};

// Command details
const commandDetails = {
    translate: {
        description: 'Translate a message to a specified language',
        usage: '/translate <message> <target_language> [source_language]',
        example: '/translate "Hello world" es',
        note: 'Use /language-codes to see available language codes'
    },
    'language-codes': {
        description: 'View all available language codes',
        usage: '/language-codes',
        example: '/language-codes',
        note: 'Use the dropdown menu to quickly find specific languages'
    },
    'set-language': {
        description: 'Set the default translation language for the server',
        usage: '/set-language <language_code>',
        example: '/set-language en',
        note: 'This affects auto-translation behavior'
    },
    'set-auto-translate': {
        description: 'Enable or disable automatic translation',
        usage: '/set-auto-translate <true/false>',
        example: '/set-auto-translate true',
        note: 'When enabled, messages are automatically translated'
    },
    'add-blacklist': {
        description: 'Add a language to the blacklist',
        usage: '/add-blacklist <language_code>',
        example: '/add-blacklist fr',
        note: 'Blacklisted languages will not be translated'
    },
    'list-blacklist': {
        description: 'View all blacklisted languages',
        usage: '/list-blacklist',
        example: '/list-blacklist',
        note: 'Shows currently blacklisted languages for this server'
    },
    'remove-blacklist': {
        description: 'Remove a language from the blacklist',
        usage: '/remove-blacklist <language_code>',
        example: '/remove-blacklist fr',
        note: 'Allows translation for the removed language'
    },
    'log-channel': {
        description: 'Set the channel for translation logs',
        usage: '/log-channel <channel>',
        example: '/log-channel #translations',
        note: 'Translation activity will be logged to this channel'
    },
    'set-message-type': {
        description: 'Configure how translated messages appear',
        usage: '/set-message-type <type>',
        example: '/set-message-type Text Expanded',
        note: 'Choose between different display formats'
    },
    'view-settings': {
        description: 'View current server settings',
        usage: '/view-settings',
        example: '/view-settings',
        note: 'Displays all configured settings for this server'
    }
};

function createCategoryEmbed(category) {
    const embed = new EmbedBuilder()
        .setTitle(categories[category].name)
        .setDescription(categories[category].description)
        .setColor(categories[category].color);

    categories[category].commands.forEach(cmd => {
        const details = commandDetails[cmd];
        embed.addFields({
            name: `\`/${cmd}\``,
            value: `Description: ${details.description}\nUsage: ${details.usage}\nExample: ${details.example}\nNote: ${details.note}\n`
        });
    });

    return embed;
}

function createMainEmbed() {
    const embed = new EmbedBuilder()
        .setTitle('📚 Translation Bot Help')
        .setDescription('Select a category from the dropdown menu below to view specific commands.')
        .setColor('#f1c40f');

    Object.entries(categories).forEach(([key, category]) => {
        embed.addFields({
            name: category.name,
            value: `${category.description}\nCommands: ${category.commands.map(cmd => `\`/${cmd}\``).join(', ')}`
        });
    });

    return embed;
}

function createCategoryMenu() {
    const options = Object.entries(categories).map(([key, category]) => ({
        label: category.name,
        description: category.description,
        value: key
    }));

    return new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('help_category')
                .setPlaceholder('Select a category...')
                .addOptions(options)
        );
}

module.exports = {
    name: 'help',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View bot commands and usage information'),

    async execute(interaction) {
        const mainEmbed = createMainEmbed();
        const categoryMenu = createCategoryMenu();

        const response = await interaction.reply({
            embeds: [mainEmbed],
            components: [categoryMenu],
            fetchReply: true
        });

        const collector = response.createMessageComponentCollector({
            time: 5 * 60 * 1000 // 5 minutes
        });

        collector.on('collect', async i => {
            if (!i.isStringSelectMenu()) return;

            try {
                const category = i.values[0];
                const categoryEmbed = createCategoryEmbed(category);

                await i.update({
                    embeds: [categoryEmbed],
                    components: [categoryMenu]
                });
            } catch (error) {
                console.error('Error handling help menu interaction:', error);
                await i.reply({
                    content: 'An error occurred while displaying help information.',
                    ephemeral: true
                }).catch(console.error);
            }
        });

        collector.on('end', () => {
            const disabledMenu = createCategoryMenu();
            disabledMenu.components[0].setDisabled(true);

            interaction.editReply({
                components: [disabledMenu]
            }).catch(console.error);
        });
    }
};
