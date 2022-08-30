const { Client } = require('discord.js');
const path = require('path');

/**
 * @param {Client} client 
 */
module.exports = async (client) => {
    const guild = client.guilds.cache.get(client.config.guildId);
    if(!guild || !guild.available) console.log("[!] Guild with id " + client.config.guildId + " is not available.");

    console.log(`Logged in as ${client.user.tag}`);
    require('../Handler/commands').loadPluginsCommands(client);
    require('../Handler/commands').loadCommands(client);
    await require('../Handler/commands').deployCommands(client);
};