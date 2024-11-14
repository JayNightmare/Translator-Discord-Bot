const { ensureServerData, ensureUserData } = require('../utils/utils-ensureData.js');

module.exports = {
    name: 'guildCreate',
    async execute(guild) {
        const serverId = guild.id;

        // Fetch all members of the guild
        await guild.members.fetch(); // Ensure members are cached

        // Ensure server data is initialized
        await ensureServerData(serverId, guild);

        // Loop through each member in the guild
        guild.members.cache.forEach(async (member) => {
            const userId = member.id;

            // Ensure the user data exists for this user
            await ensureUserData(serverId, userId);
        });

        // Store owner and member information in the database
        const ownerId = guild.ownerId;
        const memberCount = guild.memberCount;

        await saveOwnerData(serverId, ownerId, memberCount);
    }
}