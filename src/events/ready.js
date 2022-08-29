const { Client } = require('discord.js');

/**
 * @param {Client} client 
 */
module.exports = async (client) => {
    console.log(`Logged in as ${client.user.tag}`);
    await require('../Handler/commands').loadPluginsCommands(client);
};