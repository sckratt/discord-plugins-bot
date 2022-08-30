const { Client, CommandInteraction, InteractionType, Guild, Colors, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const path = require('path');
const fs = require('fs');

/**
 * @param {Client} client 
 * @param {Guild} guild 
 */
async function loadAllEmojis(guild) {
    let list = [];

    fs.readdirSync(path.resolve(process.cwd(), "assets/emojis"))
    .filter(f => f.toLowerCase().endsWith("jpeg") || f.toLowerCase().endsWith("png") || f.toLowerCase().endsWith("gif"))
    .forEach(f => {
        list.push({
            path: path.resolve(process.cwd(), "assets/emojis/" + f),
            name: f.split(".")[0]
        });
    });

    fs.readdirSync(path.resolve(process.cwd(), "plugins"))
    .filter(f => fs.statSync(path.resolve(process.cwd(), "plugins/" + f)).isDirectory())
    .forEach(f => {
        if(!fs.existsSync(path.resolve(process.cwd(), "plugins/" + f + "/assets/emojis"))) return;

        fs.readdirSync(path.resolve(process.cwd(), "plugins/" + f + "/assets/emojis"))
        .filter(file => file.toLowerCase().endsWith("jpeg") || file.toLowerCase().endsWith("png") || file.toLowerCase().endsWith("gif"))
        .forEach(file => {
            list.push({
                path: path.resolve(process.cwd(), "plugins/" + f + "/assets/emojis/" + file),
                name: file.split(".")[0]
            });
        });
    });

    list.forEach(async ({ path, name }) => {
        try {
            await guild.emojis.cache.find(e => e.name == name)?.delete().catch(()=>'');
            await guild.emojis.create({
                name: name, reason: "Plugins Bot",
                attachment: path
            });
        } catch {};
    });
    return;
};

module.exports = { loadAllEmojis };