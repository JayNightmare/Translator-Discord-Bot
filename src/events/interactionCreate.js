module.exports = {
    name: 'interactionCreate',
    async execute(interaction, sessionData) {
        if (!interaction.isCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.warn(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction, sessionData);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);
            try {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            } catch (replyError) {
                console.error(`Error sending error reply:`, replyError);
            }
        }
    },
};
