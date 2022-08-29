const { Client } = require('discord.js');

/**
 * @param {Client} client 
 */
module.exports = async (client) => {
    console.log(`Logged in as ${client.user.tag}`);
    require('../Handler/commands').loadPluginsCommands(client);
    require('../Handler/commands').loadCommands(client);
    await require('../Handler/commands').deployCommands(client);
};