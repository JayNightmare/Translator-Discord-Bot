const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle } = require('discord.js');
const languageMap = require('./language/languageMap.json');

// Group languages by first letter
const groupedLanguages = Object.entries(languageMap).reduce((acc, [code, language]) => {
    const firstLetter = language[0].toUpperCase();
    if (!acc[firstLetter]) {
        acc[firstLetter] = [];
    }
    acc[firstLetter].push({ code, language });
    return acc;
}, {});

// Sort languages within each group
Object.keys(groupedLanguages).forEach(letter => {
    groupedLanguages[letter].sort((a, b) => a.language.localeCompare(b.language));
});

// Create pages of content with 2 letters per page
const ITEMS_PER_LETTER = 10;
const pages = [];
const letters = Object.keys(groupedLanguages).sort();

// Group letters into pairs
for (let i = 0; i < letters.length; i += 2) {
    const firstLetter = letters[i];
    const secondLetter = letters[i + 1];
    
    const firstLetterLanguages = groupedLanguages[firstLetter];
    const secondLetterLanguages = secondLetter ? groupedLanguages[secondLetter] : [];

    // Calculate max pages needed for this letter pair
    const maxPages = Math.max(
        Math.ceil(firstLetterLanguages.length / ITEMS_PER_LETTER),
        secondLetter ? Math.ceil(secondLetterLanguages.length / ITEMS_PER_LETTER) : 0
    );

    for (let pageNum = 0; pageNum < maxPages; pageNum++) {
        const firstLetterContent = firstLetterLanguages.slice(
            pageNum * ITEMS_PER_LETTER,
            (pageNum + 1) * ITEMS_PER_LETTER
        );

        const secondLetterContent = secondLetter ? secondLetterLanguages.slice(
            pageNum * ITEMS_PER_LETTER,
            (pageNum + 1) * ITEMS_PER_LETTER
        ) : [];

        pages.push({
            letters: secondLetter ? [firstLetter, secondLetter] : [firstLetter],
            content: {
                [firstLetter]: firstLetterContent,
                ...(secondLetter && { [secondLetter]: secondLetterContent })
            },
            pageNumber: pageNum + 1,
            totalPages: maxPages
        });
    }
}

function createEmbed(page) {
    const embed = new EmbedBuilder()
        .setTitle(`Language Codes - ${page.letters.join(' & ')}`)
        .setColor('#0099ff');

    let description = '';
    for (const letter of page.letters) {
        if (page.content[letter].length > 0) {
            description += `**${letter}**\n${page.content[letter]
                .map(({ code, language }) => `\`${code}\` - ${language.charAt(0).toUpperCase() + language.slice(1)}`)
                .join('\n')}\n\n`;
        }
    }

    embed.setDescription(description.trim())
        .setFooter({ 
            text: `Page ${page.pageNumber}/${page.totalPages} • Total Languages: ${Object.keys(languageMap).length}` 
        });
    
    return embed;
}

function createButtons(currentPage, totalPages) {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('first')
                .setLabel('<<')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 1),
            new ButtonBuilder()
                .setCustomId('prev')
                .setLabel('<')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 1),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('>')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages),
            new ButtonBuilder()
                .setCustomId('last')
                .setLabel('>>')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages)
        );
    
    return row;
}

function createSearchMenu() {
    const options = [];
    for (let i = 0; i < letters.length; i += 2) {
        const label = letters[i + 1] 
            ? `${letters[i]}-${letters[i + 1]}` 
            : letters[i];
        const description = letters[i + 1] 
            ? `View languages starting with ${letters[i]} to ${letters[i + 1]}` 
            : `View languages starting with ${letters[i]}`;
        const value = letters[i + 1] 
            ? `${letters[i]}-${letters[i + 1]}` 
            : letters[i];

        options.push({ label, description, value });
    }

    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('letter_select')
                .setPlaceholder('Jump to section...')
                .addOptions(options)
        );
    
    return row;
}

module.exports = {
    createEmbed,
    createButtons,
    createSearchMenu,
    pages
};
