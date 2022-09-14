require('dotenv').config();
const fs = require('fs');
const path = require('path');
const config = require("../config");
const devconfig = require("./devconfig");
const { loadAllEmojis, loadEmojisProcess } = require('./utils/loadEmojis');

if(!config.guildId) throw new Error("Missing config value: Guild ID is not provided !");

const { Client, IntentsBitField, Partials, EmbedBuilder, Colors } = require('discord.js');

const client = new Client({
    intents: Object.values(IntentsBitField.Flags),
    partials: Object.values(Partials)
});
client.config = config;
client.devconfig = devconfig;
client.db = require('./Handler/database.js').db;
if(client.devconfig.clearDatabaseOnStart) client.db('base').deleteAll();
/**
 * @param {object} options
 * @param {string?} options.fr
 * @param {string?} options.en 
 */
client.translate = function(options) {
    return options[client.config.language]
};
client.utils = {
    loadAllEmojis,
    embeds: {
        error(message) {
            return new EmbedBuilder()
                .setColor(Colors.Orange)
                .setDescription(`⚠ - **${message}**`)
        }, success(message) {
            return new EmbedBuilder()
                .setColor(Colors.Green)
                .setDescription(`✅ - **${message}**`)
        }
    }
};


require('./Handler/modulesState').then(() => {
    require('./Handler/modules');
    require('./Handler/events.js').loadEvents(client);
    require('./Handler/events.js').loadPluginsEvents(client);
    require('./Handler/events').pushEvents(client);
    client.login(process.env.TOKEN);
});