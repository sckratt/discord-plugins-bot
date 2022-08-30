const { Client, CommandInteraction, SlashCommandSubcommandBuilder, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
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
        if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return;
        try {
            await interaction.deferReply();

            const db = client.db("base");
            if(!await db.has("plugins")) await db.set("plugins", {});
            
            let modules = [{
                name: "📄 » Base",
                enabled: true
            }];
            let temp_modules = [];
            for( let i=0; i<client.commands.filter(c => c.manifest).length; i++ ) {
                const { manifest } = client.commands.filter(c => c.manifest)[i];

                if(!await db.has(`plugins.${manifest.command_name}`))
                    await db.set(`plugins.${manifest.command_name}`, true)
                if(!temp_modules.includes(manifest.command_name)) {
                    temp_modules.push(manifest.command_name);
                    modules.push({
                        name: (manifest.emoji ? manifest.emoji + " » " : "") + "**" + manifest.name + "**",
                        enabled: await db.get(`plugins.${manifest.command_name}`)
                    });
                };
            };
            
            let emojis = [
                interaction.guild.emojis.cache.find(e => e.name == "enabled")?.toString(),
                interaction.guild.emojis.cache.find(e => e.name == "disabled")?.toString()
            ];
            if(!emojis[0] || !emojis[1]) emojis = ["✅", "❌"];
            
            const panel = new EmbedBuilder()
                .setAuthor({
                    name: client.translate({
                        fr: `${interaction.guild?.name} - Etat des plugin`,
                        en: `${interaction.guild?.name} - Plugin states`
                    }),
                    iconURL: interaction.guild?.iconURL()
                }).addFields(modules.map(module => ({
                    name: module?.name || "\u200B",
                    value: (module ? module.enabled ? emojis[0] : emojis[1] : "\u200B") + (module.name === "📄 » Base" ? ' 🔒' : ""),
                    inline: true
                }))).setFooter({
                    text: "Asked by: " + interaction.user.tag,
                    iconURL: interaction.user.displayAvatarURL()
                }).setTimestamp()
    
            const disableButton = new ButtonBuilder()
                .setCustomId(`pluginsManager.disable.${interaction.user.id}`)
                .setEmoji(emojis[1])
                .setStyle(ButtonStyle.Secondary)
                .setLabel(client.translate({
                    fr: "Désactiver un plugin",
                    en: "Disable a plugin"
                }))
            const enableButton = new ButtonBuilder()
                .setCustomId(`pluginsManager.enable.${interaction.user.id}`)
                .setEmoji(emojis[0])
                .setStyle(ButtonStyle.Secondary)
                .setLabel(client.translate({
                    fr: "Activer un plugin",
                    en: "Enable a plugin"
                }))
            const actionrow = new ActionRowBuilder()
                .addComponents([ disableButton, enableButton ])
            
            await interaction.editReply({ embeds: [panel], components: [actionrow] })
        } catch (err) {
            console.error(err);
        };
    }
};