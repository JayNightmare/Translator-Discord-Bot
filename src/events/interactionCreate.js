import { createIgnoreWordsEmbed } from '../commands/ignore.js'; // Assuming ignore.js has the embed creation
import { log } from '../utils/logger.js';

export async function onInteractionCreate(interaction) {
    if (interaction.isButton()) {
        // Button interaction handling
        const currentPage = parseInt(interaction.message.embeds[0].footer.text.match(/Page (\d+) of/)[1]);

        if (interaction.customId === 'prev10') currentPage -= 10;
        else if (interaction.customId === 'prev') currentPage -= 1;
        else if (interaction.customId === 'next') currentPage += 1;
        else if (interaction.customId === 'next10') currentPage += 10;

        // Ensure the page is within valid range
        const { embed, buttons } = createIgnoreWordsEmbed(currentPage);
        await interaction.update({ embeds: [embed], components: [buttons] });
        log(`Updated page to ${currentPage} on interaction`);
    }
    
    // Other interaction types can be handled here as needed
    if (interaction.isCommand()) {
        // Handle slash command interactions
        const { commandName } = interaction;
        if (commandName === 'translate') {
            // Execute translate command logic (assuming `translate.js` handles it)
            // You would call the respective command handler here
        }
    }
}
