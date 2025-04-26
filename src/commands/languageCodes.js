const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed, createButtons, createSearchMenu, pages } = require('../utils/utils-languageCodes');

module.exports = {
    name: 'language-codes',
    data: new SlashCommandBuilder()
        .setName('language-codes')
        .setDescription('View all available language codes'),
    
    async execute(interaction) {
        let currentPageIndex = 0;
        const page = pages[currentPageIndex];
        
        const embed = createEmbed(page);
        const buttons = createButtons(page.pageNumber, page.totalPages);
        const searchMenu = createSearchMenu();
        
        const response = await interaction.reply({
            embeds: [embed],
            components: [searchMenu, buttons],
            fetchReply: true
        });
        
        const collector = response.createMessageComponentCollector({
            time: 5 * 60 * 1000 // 5 minutes
        });
        
        collector.on('collect', async i => {
            try {
                if (!i.isButton() && !i.isStringSelectMenu()) return;

                let newPage;
                
                if (i.isButton()) {
                    switch (i.customId) {
                        case 'first':
                            currentPageIndex = 0;
                            break;
                        case 'prev':
                            currentPageIndex = Math.max(0, currentPageIndex - 1);
                            break;
                        case 'next':
                            currentPageIndex = Math.min(pages.length - 1, currentPageIndex + 1);
                            break;
                        case 'last':
                            currentPageIndex = pages.length - 1;
                            break;
                    }
                    newPage = pages[currentPageIndex];
                } else if (i.isStringSelectMenu() && i.customId === 'letter_select') {
                    const selectedValue = i.values[0];
                    // Handle both single letter and range selections
                    const [startLetter] = selectedValue.split('-');
                    // Find the first page that includes the selected letter
                    currentPageIndex = pages.findIndex(p => p.letters.includes(startLetter));
                    if (currentPageIndex === -1) currentPageIndex = 0;
                    newPage = pages[currentPageIndex];
                }

                if (!newPage) {
                    console.error('No page found at index:', currentPageIndex);
                    newPage = pages[0]; // Fallback to first page
                }

                const newEmbed = createEmbed(newPage);
                const newButtons = createButtons(newPage.pageNumber, newPage.totalPages);
            
                await i.update({
                    embeds: [newEmbed],
                    components: [searchMenu, newButtons]
                });
            } catch (error) {
                console.error('Error handling interaction:', error);
                await i.reply({ 
                    content: 'An error occurred while updating the language codes display.',
                    ephemeral: true 
                }).catch(console.error);
            }
        });
        
        collector.on('end', () => {
            const disabledButtons = createButtons(page.pageNumber, page.totalPages);
            disabledButtons.components.forEach(button => button.setDisabled(true));
            
            const disabledMenu = createSearchMenu();
            disabledMenu.components[0].setDisabled(true);
            
            interaction.editReply({
                components: [disabledMenu, disabledButtons]
            }).catch(console.error);
        });
    }
};
