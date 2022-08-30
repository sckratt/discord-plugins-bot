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
    await require('../Handler/commands').deployCommands(client);

    if(!guild || !guild.available)
        console.log("[!] Guild with id " + client.config.guildId + " is not available.");
    else {
        const enabledEmoji = guild.emojis.cache.find(e => e.name == "enabled");
        const disabledEmoji = guild.emojis.cache.find(e => e.name == "disabled");

        try {
            if(!enabledEmoji) {
                console.log("Creating enabled emoji in your server for the panel command...");
                await guild.emojis.create({
                    name: "enabled", reason: "Plugins Bot - Panel command",
                    attachment: path.resolve(process.cwd(), "assets/enabled.png")
                });
                console.log("Enabled emoji created !");
            };
        } catch (err) { return console.error(err); console.log("Could not create enabled emoji... Please check my permissions or if the emoji file exists in the asset folder !") };

        try {
            if(!disabledEmoji) {
                console.log("Creating disabled emoji in your server for the panel command...");
                await guild.emojis.create({
                    name: "disabled", reason: "Plugins Bot - Panel command",
                    attachment: path.resolve(process.cwd(), "assets/disabled.png")
                });
                console.log("Disabled emoji created !");
            };
        } catch { console.log("Could not create disabled emoji... Please check my permissions or if the emoji file exists in the asset folder !") };


    }
};