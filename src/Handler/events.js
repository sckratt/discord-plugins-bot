const fs = require('fs');
const path = require('path');
const { Client, Collection } = require('discord.js');
/**
 * @param {Client} client 
 */
function loadEvents(client, dirname = path.join(__dirname, "../events")) {
    client.events = [];

    fs.readdirSync(dirname).forEach(file => {
        if (fs.statSync(path.join(dirname, file)).isDirectory()) {
            loadEvents(client, path.join(dirname, file));
        } else {
            client.events.push({
                name: file.split(".js").shift(),
                execute: require( "./" + path.relative(__dirname, path.join(dirname, file)) )
            });
        };
    });
};
/**
 * @param {Client} client 
 */
function loadPluginsEvents(client, dirname = path.resolve(process.cwd(), "plugins"), pluginName = "") {
    fs.readdirSync(dirname)
    .forEach(file => {
        if( fs.statSync(path.join(dirname, file)).isDirectory() ) return loadPluginsEvents(client, path.join(dirname, file), pluginName ? pluginName : file);
        const pluginManifest = require(path.relative(__dirname, path.join(dirname, pluginName, "manifest.json")));
        client.events.push({
            name: file.split(".js").shift(),
            pluginName: pluginManifest.command_name,
            execute: require( "./" + path.relative(__dirname, path.join(dirname, file)) )
        });
    });
};

/**
 * @param {Client} client 
 */
function pushEvents(client) {
    for(let event of client.events) {
        client.on(event.name, async (...args) => {
            const db = client.db("base");
            if(!await db.get(`plugins.${event.pluginName}`)) return;
            event.execute(client, ...args);
        });
    };
};

module.exports = { loadEvents, loadPluginsEvents, pushEvents };