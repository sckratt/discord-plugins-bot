const { Client } = require('discord.js');
const { QuickDB } = require('quick.db');
const fs = require('fs');
const path = require('path');
const config = require(path.relative(__dirname, path.join(process.cwd(), "config.js")));

/**
 * @param {string} dbname
 */
function db(dbname) {
    if(!dbname) throw new Error("Missing parameters: The database name must be provided");
    if(!fs.existsSync(path.resolve(process.cwd(), "data/" + config.guildId)))
        fs.mkdirSync(path.resolve(process.cwd(), "data/" + config.guildId), { recursive: true })
    const db = new QuickDB({ filePath: path.resolve(process.cwd(), 'data/' + config.guildId + "/" + dbname + ".sqlite") });

    return db;
};

module.exports = { db };