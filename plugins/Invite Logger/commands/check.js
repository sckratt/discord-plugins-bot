const { Client, CommandInteraction, SlashCommandSubcommandBuilder } = require('discord.js');

module.exports = {
    /**
     * @param {Client} client 
     * @returns {SlashCommandSubcommandBuilder}
     */
    render() {
        return new SlashCommandSubcommandBuilder()
            .setName('check')
            .setDescription("Check the invites count")
            .setDescriptionLocalizations({
                fr: "Regardez le compte d'invitations"
            }).addUserOption(option =>
                option.setRequired(false)
                    .setName("user")
                    .setNameLocalizations({
                        fr: "utilisateur"
                    }).setDescription("The user you want to check invites count")
                    .setDescriptionLocalizations({
                        fr: "L'utilisateur dont vous voulez le compte"
                    })
            )
    },
    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     */
    async execute(client, interaction) {

    }
};