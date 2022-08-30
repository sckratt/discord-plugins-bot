const { Client, CommandInteraction, SlashCommandSubcommandBuilder, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    /**
     * @param {Client} client 
     * @returns {SlashCommandSubcommandBuilder}
     */
    render() {
        return new SlashCommandBuilder()
            .setName("panel")
            .setDescription("Plugins menu / enable or disable plugins")
            .setDescriptionLocalizations({
                fr: "Menu des plugins / activez ou désactivez les plugins"
            })
    },
    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     */
    async execute(client, interaction) {
        
        const db = client.db("base");
        if(!await db.has("plugins")) await db.set("plugins", {});
        
        const modules = [];
        for(
            let { manifest } of
            client.commands.filter(c => c.foldername)
        ) {
            if(!await db.has(`plugins.${manifest.commandname}`))
                await db.set(`plugins.${manifest.commandname}`, true)
            
            modules.push({
                name: (manifest.emoji ? manifest.emoji + " » " : "") + "**" + manifest.name + "**",
                enabled: await db.get(`plugins.${manifest.commandname}`)
            });
        };

        let emojis = [
            interaction.guild.emojis.cache.find(e => e.name == "enabled")?.toString(),
            interaction.guild.emojis.cache.find(e => e.name == "disabled")?.toString()
        ];
        if(!emojis[0] || !emojis[1]) emojis = ["✅", "❌"];

        const panel = new EmbedBuilder()
            .setAuthor({ name: interaction.guild?.name, iconURL: interaction.guild?.iconURL() })
            .addFields(modules.map(module => ({
                name: module.name,
                value: module.enabled ? emojis[0] : emojis[1]
            }))).setFooter({
                text: "Asked by: " + interaction.user.tag,
                iconURL: interaction.user.displayAvatarURL()
            }).setTimestamp()

        const disableButton = new ButtonBuilder()
            .setCustomId("plugins.disable")
            .setEmoji(emojis[1])
            .setStyle(ButtonStyle.Secondary)
            .setLabel(client.translate({
                fr: "Désactiver un plugin",
                en: "Disable a plugin"
            }))
        const enableButton = new ButtonBuilder()
            .setCustomId("plugins.enable")
            .setEmoji(emojis[0])
            .setStyle(ButtonStyle.Secondary)
            .setLabel(client.translate({
                fr: "Activer un plugin",
                en: "Enable a plugin"
            }))
        const actionrow = new ActionRowBuilder()
            .addComponents([ disableButton, enableButton ])
        
        interaction.reply({ embeds: [panel], components: [actionrow] })
    }
};