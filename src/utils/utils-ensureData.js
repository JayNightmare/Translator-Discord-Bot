// * Ensure Data:
function ensureUserData(serverId, userId) {
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT OR IGNORE INTO users (serverId, userId, xp, totalXp, level, bio )
            VALUES (?, ?, 0, 0, 1, '')
        `, [serverId, userId], (err) => {
            if (err) {
                console.error("Error ensuring user exists:", err.message);
                return reject(err);
            }
            resolve();
        });
    });
}

async function ensureServerData(serverId, guild, userId) {
    // Fetch data from the database
    const serverConfig = await getServerConfigsData(serverId);

    // If server configuration doesn't exist, initialize with default values
    if (!settingsConfig) {
        const defaultServerData = {
            serverId: serverId,
            blacklistedChannels: [],  // Store as JSON array
            allowedChannel: null,
            loggingChannelId: null,
        };

        await saveServerConfig(serverId, defaultServerData);
    }

    if (!serverConfig) {

    }
}

module.exports = {
    ensureUserData,
    ensureServerData,
}