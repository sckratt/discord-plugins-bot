const { Client, Interaction, InteractionType } = require('discord.js');

/**
 * @param {Client} client 
 * @param {Interaction} interaction
 */
module.exports = async (client, interaction) => {
    console.log(interaction.type);
    if(interaction.type === InteractionType.ApplicationCommand) {
        const subcommandname = interaction.options.getSubcommand();
        
        if(subcommandname) {
            const execute = client.commands.find(cmd => cmd.name == subcommandname && cmd.groupname == interaction.commandName)?.execute;
            if(typeof execute == "function") execute(client, interaction);
            return;
        } else {
            const execute = client.commands.find(cmd => cmd.name == interaction.commandName && !cmd.groupname)?.execute;
            if(typeof execute == "function") execute(client, interaction);
            return;
        };
    };
};