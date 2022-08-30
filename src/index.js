require('dotenv').config();
const fs = require('fs');
const path = require('path');
const config = require("../config");
const devconfig = require("./config");

if(!config.guildId) throw new Error("Missing config value: Guild ID is not provided !");

const { Client, IntentsBitField, Partials } = require('discord.js');

const client = new Client({
    intents: Object.values(IntentsBitField.Flags),
    partials: Object.values(Partials)
});
client.config = config;
client.devconfig = devconfig;
client.db = require('./Handler/database.js').db;
/**
 * @param {object} options
 * @param {string?} options.fr
 * @param {string?} options.en 
 */
client.translate = function(options) {
    return options[client.config.language]
};


require('./Handler/events.js').loadEvents(client);
require('./Handler/events.js').loadPluginsEvents(client);
client.login(process.env.TOKEN);