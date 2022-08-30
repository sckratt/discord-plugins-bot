const { Client } = require('discord.js');
const { QuickDB } = require('quick.db');
const path = require('path');

/**
 * @param {string} dbname
 */
function db(dbname) {
    if(!dbname) throw new Error("Missing parameters: The database name must be provided");
    const db = new QuickDB({ filePath: path.resolve(process.cwd(), 'data/' + dbname) });

    return db;
};

module.exports = { db };