const Server = require('../models/Server.js');
const { log } = require('../utils/utils-logger');

async function registerServer(serverId, guild) {
    let server = await Server.findOne({ serverId, name: guild.name });
    if (!server) {
        server = await Server.create({ serverId,  });
        log(`New user registered: ${username}`);
    }
    return server;
}

module.exports = { registerServer };