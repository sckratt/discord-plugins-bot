const { Client, Interaction, InteractionType, EmbedBuilder, Colors, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, SelectMenuBuilder, SelectMenuOptionBuilder } = require('discord.js');
const { db } = require('../../Handler/database');

/**
 * @param {Client} client 
 * @param {Interaction} interaction
 */
module.exports = async (client, interaction) => {
    
    if(!interaction.guild || !interaction.guild?.available || interaction.guild?.id !== client.config.guildId) return;
    
    if(interaction.type === InteractionType.ApplicationCommand) {
        try {
            const subcommandname = interaction.options.getSubcommand();
            const execute = client.commands.find(cmd => cmd.name == subcommandname && cmd.groupname == interaction.commandName)?.execute;
            if(typeof execute == "function") execute(client, interaction);
        } catch {
            const execute = client.commands.find(cmd => cmd.name == interaction.commandName && !cmd.groupname)?.execute;
            if(typeof execute == "function") execute(client, interaction);
        };
    };
    if(interaction.type === InteractionType.MessageComponent) {
        if(interaction.isButton()) {
            if(interaction.customId.startsWith("pluginsManager")) {
                if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return;
                const db = client.db('base');
                if(!await db.has("plugins")) await db.set("plugins", {});

                if(interaction.user.id !== interaction.customId.split('.')[2]) return await interaction.update({});
                await interaction.deferUpdate();
                
                const action = interaction.customId.split(".")[1];
                let resp;

                try {
                    resp = await pluginChooser();
                    if(!resp.resp || !resp.i) return;
                    await db.set(`plugins.${resp.resp}`, action == "enable");let modules = [{
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
                            value: (module ? module.enabled ? emojis[0] : emojis[1] : "\u200B") + (module.name === "📄 » Base" ? '🔒' : ""),
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
                    const panelactionrow = new ActionRowBuilder()
                        .addComponents([ disableButton, enableButton ])
                    
                    await resp.i.editReply({ embeds: [
                        panel,
                        client.utils.embeds.success(client.translate({
                            fr: "Le plugin " + client.commands.find(c => c.manifest && c.commandname === resp.resp).manifest.name + " a été " + (action == "enable" ? "activé" : "désactivé") + ".",
                            en: `The plugin named ${client.commands.find(c => c.manifest && c.commandname === resp.resp).manifest.name} has been ${action}d.`
                        }))
                    ], components: [panelactionrow] })
                } catch {
                    interaction.editReply({ embeds: [
                        client.utils.embeds.error(client.translate({
                            fr: `Vous n'avez aucun plugin à ` + (action == `enable` ? `activer` : `désactiver`) + `.`,
                            en: `You have no plugin to ` + action + `.`
                        }))
                    ], components: [] })
                }

                async function pluginChooser() {
                    const selectMenuOptions = [];
                    const temp = [];

                    for(let cmd of client.commands.filter(c => c.manifest)) {
                        if(!await db.has(`plugins.${cmd.commandname}`)) await db.set(`plugins.${cmd.commandname}`, true);
                        let isPluginEnabled = await db.get(`plugins.${cmd.commandname}`);

                        if(!temp.includes(cmd.commandname) && (action == "enable" ? !isPluginEnabled : isPluginEnabled)) {
                            temp.push(cmd.commandname);
                            const selectOption = new SelectMenuOptionBuilder()
                                .setLabel(cmd.manifest.name)
                                .setEmoji(cmd.manifest.emoji)
                                .setValue(cmd.commandname)
                                .setDescription(client.translate({
                                    fr: cmd.manifest.description_localizations?.fr || cmd.manifest.description || "Plugin " + cmd.manifest.name,
                                    en: cmd.manifest.description_localizations ? cmd.manifest.description_localizations['en-GB'] || cmd.manifest.description_localizations['en-US'] || cmd.manifest.description || "Plugin " + cmd.manifest.name : "Plugin " + cmd.manifest.name,
                                }))
                            selectMenuOptions.push(selectOption);
                        }
                    };

                    if(!selectMenuOptions.length) throw new Error("No SelectMenuBuilder options");

                    const embed = new EmbedBuilder()
                        .setColor(Colors.Yellow)
                        .setTitle(client.translate({
                            fr: "Choisissez le plugin que vous souhaitez " + (action == "enable" ? "activer" : "désactiver") + ".",
                            en: "Choose the plugin you want to " + action + "."
                        }))

                    const selectmenu = new SelectMenuBuilder()
                        .setCustomId("select")
                        .setMaxValues(1)
                        .setPlaceholder(client.translate({ fr: "Aucun plugin séléctionné", en: "No plugin selected" }))
                        .addOptions(selectMenuOptions)

                    const actionrow = new ActionRowBuilder()
                        .addComponents([ selectmenu ])

                    let resp;
                    let i;
                    const msg = await interaction.editReply({ embeds: [embed], components: [actionrow] })
                    await msg.awaitMessageComponent({
                        time: 30000,
                        filter: (inter) => inter.user.id == interaction.user.id && inter.isSelectMenu()
                    }).then(async (inter) => {
                        resp = inter.values.shift();
                        i = inter;
                        await i.deferUpdate();
                    }).catch(async () => {
                        await msg.edit({ embeds: [ client.utils.embeds.error(client.translate({
                            fr: "Vous n'avez pas répondu à temps !",
                            en: "You did not answer on time !"
                        })) ], components: [] })
                    });
                    return { i, resp };
                };
            };
        }
    };
};