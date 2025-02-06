module.exports = {
    name: 'interactionCreate',
    async execute(interaction, sessionData) {
        console.log(`Interaction received: ${interaction.type}`);

        if (interaction.isCommand()) {
            console.log(`Command interaction: ${interaction.commandName}`);
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.warn(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction, sessionData);
                console.log(`Command ${interaction.commandName} executed successfully.`);
            } catch (error) {
                console.error(`Error executing command ${interaction.commandName}:`, error);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'An error occurred while executing this command.', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
                    }
                } catch (replyError) {
                    console.error(`(error #%d) Error sending error reply:`, replyError);
                }
            }
        }
        
        else if (interaction.isButton()) {
            console.log(`Button interaction: ${interaction.customId}`);
            const button = interaction.client.buttons?.get(interaction.customId);
            if (!button) return console.warn(`No button handler found for ${interaction.customId}.`);

            try {
                await button.execute(interaction, sessionData);
                console.log(`Button ${interaction.customId} executed successfully.`);
            } catch (error) {
                console.error(`Error executing button ${interaction.customId}:`, error);
                try {
                    await interaction.reply({ content: 'An error occurred while processing this button.', ephemeral: true });
                } catch (replyError) {
                    console.error(`(error #%d) Error sending button error reply:`, replyError);
                }
            }
        }
        
        else if (interaction.isSelectMenu()) {
            console.log(`Select menu interaction: ${interaction.customId}`);
            const selectMenu = interaction.client.selectMenus?.get(interaction.customId);
            if (!selectMenu) return console.warn(`No select menu handler found for ${interaction.customId}.`);

            try {
                await selectMenu.execute(interaction, sessionData);
                console.log(`Select menu ${interaction.customId} executed successfully.`);
            } catch (error) {
                console.error(`Error executing select menu ${interaction.customId}:`, error);
                try {
                    await interaction.reply({ content: 'An error occurred while processing this selection.', ephemeral: true });
                } catch (replyError) {
                    console.error(`(error #%d) Error sending select menu error reply:`, replyError);
                }
            }
        }
        
        else {
            console.warn(`Unhandled interaction type: ${interaction.type}`);
        }
    },
};
