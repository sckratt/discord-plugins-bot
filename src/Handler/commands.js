const { Client, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
/**
 * @param {Client} client 
 */
async function loadCommands(client) {
    
};
/**
 * @param {Client} client 
 */
async function loadPluginsCommands(client, dirname = path.join(process.cwd(), "plugins")) {
    let commands = [];
    fs.readdirSync(dirname)
    .filter(folder => 
        fs.statSync(path.join(dirname, folder)).isDirectory() &&
        fs.existsSync(path.join(dirname, folder, "commands"))
    ).forEach(folder => {
        const manifest = require('./' + path.relative(__dirname, path.join(dirname, folder, "manifest.json")));
        const Command = new SlashCommandBuilder()
            .setName(manifest.group_name)
        for(
            let commandfilename of
            fs.readdirSync(path.join(dirname, folder, "commands"))
                .filter(file => fs.statSync(path.join(dirname, folder, "commands", file)).isFile() && file.endsWith(".js") )
        ) {
            const command = require("./" + path.relative(__dirname, path.join(dirname, folder, "commands", commandfilename)));
            Command.addSubcommand(() => command.render())
        };
    });

    const rest = new REST({ version: "10" }).setToken(client.token);
    try {
        console.log('Started refreshing application (/) commands...');
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands.map(cmd => cmd.toJSON()) });
        console.log('Successfully reloaded application (/) commands.');
    } catch (err) {
        console.error(err);
    };
};

module.exports = { loadCommands, loadPluginsCommands };