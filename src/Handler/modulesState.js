const path = require('path');
const fs = require('fs');

module.exports = async (client) => {
    const pluginFolders = fs.readdirSync(path.resolve(process.cwd(), "plugins"))
    
    for(let pluginFolder of pluginFolders) {
        const manifest = require(path.relative(__dirname, path.resolve(process.cwd(), "plugins", pluginFolder, "manifest.json")));
        if(!await client.db("base").has(`plugins.${manifest.command_name}`)) await client.db("base").set(`plugins.${manifest.command_name}`, true)
    };
};