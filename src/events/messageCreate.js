module.exports = {
    name: 'messageCreate',
    async execute(client, message) {

        if (message.author.bot) return;

        

        process.on('unhandledRejection', (reason, promise) => {
            log(`Unhandled Rejection: ${reason.message || reason}`);
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
    }
}

