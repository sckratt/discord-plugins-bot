const { Client, CommandInteraction, SlashCommandSubcommandBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    /**
     * @param {Client} client 
     * @returns {SlashCommandSubcommandBuilder}
     */
    render() {
        return new SlashCommandBuilder()
            .setName("help")
            .setDescription("Get the commands menu")
            .setDescriptionLocalizations({
                fr: "Retourne le menu des commandes"
            })
    },
    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     */
    async execute(client, interaction) {
        interaction.reply({ content: "Well, commands menu is coming soon !", ephemeral: true });
    }
};