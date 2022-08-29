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

function loadPluginsEvents(client, dirname = path.resolve(process.cwd(), "plugins")) {
    fs.readdirSync(dirname)
    .forEach(file => {
        if( fs.statSync(path.join(dirname, file)).isDirectory() ) return loadPluginsEvents(client, path.join(dirname, file));
        client.on(
            file.split(".js").shift().toLowerCase(),
            (...args) => require( "./" + path.relative(__dirname, path.join(dirname, file)) )( client, ...args )
        )
    });
};

module.exports = { loadEvents, loadPluginsEvents };