import { log } from '../utils/logger.js';

export function onReady(client) {
    log(`Logged in as ${client.user.tag}!`);
    log(`Connected to servers: ${client.guilds.cache.map(guild => `${guild.name} (ID: ${guild.id})`).join(', ')}`);
    
    // Additional startup tasks can be performed here
    client.guilds.cache.forEach(guild => {
        const channels = guild.channels.cache.map(channel => `${channel.name} (ID: ${channel.id})`);
        log(`Channels in ${guild.name}: ${channels.join(', ')}`);
    });
}
