const { Client } = require('discord.js');
const { QuickDB } = require('quick.db');
const path = require('path');
const config = require("./" + path.relative(__dirname, path.join(process.cwd(), "config.json")));

/**
 * @param {string} dbname
 */
function db(dbname) {
    if(!dbname) throw new Error("Missing parameters: The database name must be provided");
    const db = new QuickDB({ filePath: path.resolve(process.cwd(), 'data/' + config.guildId + "/" + dbname) });

    return db;
};

module.exports = { db };