const { Client } = require('discord.js');
const path = require('path');

/**
 * @param {Client} client 
 */
module.exports = async (client) => {
    const guild = client.guilds.cache.get(client.config.guildId);

    console.log(`Logged in as ${client.user.tag}`);
    require('../Handler/commands').loadPluginsCommands(client);
    require('../Handler/commands').loadCommands(client);
    if(client.devconfig.refreshCommands)
        await require('../Handler/commands').deployCommands(client);

    if(!guild || !guild.available)
        console.log("[!] Guild with id " + client.config.guildId + " is not available.");
    else {
        if(client.config.loadEmojis)
            await client.utils.loadAllEmojis(guild);
    }
};