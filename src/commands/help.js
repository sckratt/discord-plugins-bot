const { Client, CommandInteraction, SlashCommandSubcommandBuilder, SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');

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
        await interaction.deferReply({ ephemeral: true });

        const modules = [{
            name: "📄 » Base",
            isBaseCommand: true,
            commands: client.commands.filter(c => c.isBaseCommand)
        }, null];
        let tmp = [];

        for(let i=0; i<client.commands.filter(c => c.manifest).length; i++) {
            const cmd = client.commands.filter(c => c.manifest)[i];
            if(!tmp.includes(cmd.commandname)) {
                if(!modules.length%3) modules.push(null);
                tmp.push(cmd.commandname);
                modules.push({
                    name: cmd.manifest.name,
                    commands: client.commands.filter(c => c.commandname === cmd.commandname)
                })
            }
        };

        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setTitle( client.translate({ fr: "Liste des commandes", en: "Bot's commands list" }) )
            .addFields(modules.map(module => ({
                name: module ? module?.isBaseCommand ? module.name : (module.commands[0].manifest.emoji ? module.commands[0].manifest.emoji + " » " : "") + module.name : "\u200B",
                value: module?.commands.map(cmd => cmd.isBaseCommand ? `> \`/${cmd.name}\`` : `> \`/${cmd.commandname} ${cmd.name}\``).join("\n") || "\u200B",
                inline: true
            }) ))
            
        await interaction.editReply({ embeds: [embed] });
    }
};