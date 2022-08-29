const fs = require('fs');
const path = require('path');
const { Client } = require('discord.js');
/**
 * @param {Client} client 
 */
function loadEvents(client, dirname = path.resolve(__dirname, "../events")) {
    fs.readdirSync(dirname).forEach(file => {
        if (fs.statSync(path.join(dirname, file)).isDirectory()) {
            loadEvents(path.join(dirname, file));
        } else {
            client.on(
                file.split(".js").shift().toLowerCase(),
                (...args) => require( "./" + path.relative(__dirname, path.join(dirname, file)) )( client, ...args )
            )
        };
    });
};

module.exports = { loadEvents };