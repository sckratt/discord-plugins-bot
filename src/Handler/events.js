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
 function loadPluginsEvents(client, dirname = path.join(process.cwd(), "plugins")) {
    if(!client.events) client.events = [];
    if(!client.configs) client.configs = [];
   fs.readdirSync(dirname)
   .filter(folder => 
       fs.statSync(path.join(dirname, folder)).isDirectory() &&
       fs.existsSync(path.join(dirname, folder, "events"))
   ).forEach(folder => {
       const manifest = require('./' + path.relative(__dirname, path.join(dirname, folder, "manifest.json")));
       if(!manifest) throw new Error(`Missing manifest.json: ${folder}`);

       if(fs.existsSync(path.join(dirname, folder, "config.js"))) {
            client.configs.push({ pluginName: folder, config: require(path.relative(__dirname, path.join(dirname, folder, "config.js"))) });
       };
       
       _(folder, manifest);
   });

    function _(pluginName, manifest, eventdir = "events") {
        const dir = path.join(process.cwd(), "plugins", pluginName, eventdir);
        fs.readdirSync(dir)
        .forEach(f => {
            if( fs.statSync(path.join(dir, f)).isDirectory() ) return _(pluginName, manifest, eventdir + "/" + f);
            const event = require(path.relative(__dirname, path.join(dir, f)));
            const eventObj = {
                name: f.split(".js").shift(),
                pluginName: manifest.command_name,
                execute: event
            }; client.events.push(eventObj);
        })
    };
};

/**
 * @param {Client} client 
 */
async function pushEvents(client) {
    const db = client.db("base");
    for(let event of client.events) {
        const pluginActive = await db.get(`plugins.${event.pluginName}`);
        client.on(event.name, async (...args) => {
            if(event.pluginName && !pluginActive) return;
            event.execute(client, ...args);
        });
    };
};

module.exports = { loadEvents, loadPluginsEvents, pushEvents };