const Server = require('../models/Server.js');

async function registerServer(serverId, guild) {
    let server = await Server.findOne({ serverId, name: guild.name });
    if (!server) {
        server = await Server.create({ serverId,  });
        console.log(`New user registered: ${username}`);
    }
    return server;
}