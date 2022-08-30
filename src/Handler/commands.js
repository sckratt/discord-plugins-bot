const { Client, SlashCommandBuilder, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

let commands = [];

/**
 * @param {Client} client 
 */
function loadCommands(client, dirname = path.join(__dirname, "../commands")) {
    if(!client.commands) client.commands = [];
    fs.readdirSync(dirname)
    .forEach(file => {
        if( fs.statSync(path.join(dirname, file)).isDirectory() ) return loadCommands(client, path.join(dirname, file));
        
        const Command = require('./' + path.relative(__dirname, path.join(dirname, file)));

        client.commands.push({
            name: Command.render().name,
            execute: Command.execute,
            isBaseCommand: true
        });
        commands.push(Command.render());
    });
};
/**
* @param {Client} client 
*/
function loadPluginsCommands(client, dirname = path.join(process.cwd(), "plugins")) {
    if(!client.commands) client.commands = [];
   fs.readdirSync(dirname)
   .filter(folder => 
       fs.statSync(path.join(dirname, folder)).isDirectory() &&
       fs.existsSync(path.join(dirname, folder, "commands"))
   ).forEach(folder => {
       const manifest = require('./' + path.relative(__dirname, path.join(dirname, folder, "manifest.json")));
       if(!manifest) throw new Error(`Missing manifest: ${folder} Plugin`);
       const Command = new SlashCommandBuilder()
           .setName(manifest.command_name)
           .setDescription(manifest.description || manifest.name)
           .setDescriptionLocalizations(manifest.description_localizations)
       for(
           let commandfilename of
           fs.readdirSync(path.join(dirname, folder, "commands"))
               .filter(file => fs.statSync(path.join(dirname, folder, "commands", file)).isFile() && file.endsWith(".js") )
       ) {
           const command = require("./" + path.relative(__dirname, path.join(dirname, folder, "commands", commandfilename)));
           Command.addSubcommand(() => command.render())
           client.commands.push({
                commandname: Command.name,
                name: command.render().name,
                isBaseCommand: false,
                manifest, execute: command.execute
           });
       };
       commands.push(Command);
   });
};
/**
* @param {Client} client 
*/
async function deployCommands(client) {
    if(!client.commands) client.commands = [];
    const rest = new REST({ version: "10" }).setToken(client.token);
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands...`);
        const data = await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands.map(cmd => cmd.toJSON()) }
        );
        console.log(`Successfully reloaded ${data.length}/${commands.length} application (/) commands.`);
    } catch (err) {
        console.error(err);
    };
};

module.exports = { loadCommands, loadPluginsCommands, deployCommands };