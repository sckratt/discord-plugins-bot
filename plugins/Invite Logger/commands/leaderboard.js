const { Client, CommandInteraction, SlashCommandSubcommandBuilder, EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    /**
     * @param {Client} client 
     * @returns {SlashCommandSubcommandBuilder}
     */
    render() {
        return new SlashCommandSubcommandBuilder()
            .setName('leaderboard')
            .setDescription("Show the server leaderboard of the best inviters")
            .setDescriptionLocalizations({
                fr: "Montre le classement des meilleurs inviteurs"
            })
    },
    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     */
    async execute(client, interaction) {
        await interaction.deferReply();
        const db = client.db("invite-logger");
        if(!await db.has("users")) await db.set("users", {});
        if(!await db.has("invites")) await db.set("invites", {});

        const membersLeaderboard = Object.values(await db.get("users"))
            .filter((memberInvites) => interaction.guild.members.cache.has(memberInvites.id))
            .sort((a,b) => totalInvitesCounter(b) - totalInvitesCounter(a))
        
        let membersLeaderboardPages = [];
        let currPage = [];
        for(let i=0; i<membersLeaderboard.length; i++) {
            if(i && !i%9) { membersLeaderboardPages.push(currPage); currPage = []; };
            currPage.push(membersLeaderboard[i]);
        };
        if(currPage.length > 0) membersLeaderboardPages.push(currPage);

        membersLeaderboardPages = membersLeaderboardPages
            .map((page, i) => {
                let messageActionRaws = [];
                let messageButtons = [];

                let embed = new EmbedBuilder()
                    .setColor(Colors.Blue)
                    .setAuthor({ name: "👑 Leaderboard - " + interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setDescription(
                        page.map((memberInvites, j) => {
                            return client.translate({
                                fr: `**${j+1+i*10}.** ` +
                                    `${interaction.guild.members.cache.get(memberInvites.id).user.toString()} - ` +
                                    `**${totalInvitesCounter(memberInvites).toLocaleString('fr')}** ` +
                                    `(**${memberInvites.invites.normal}** invité${memberInvites.invites.normal > 1 ? "s" : ""}, ` +
                                    `**${memberInvites.invites.left}** parti${memberInvites.invites.left > 1 ? "s" : ""}, ` +
                                    `**${memberInvites.invites.fake}** invalidée${memberInvites.invites.fake > 1 ? "s" : ""}, ` +
                                    `**${memberInvites.invites.bonus}** bonus)`,
                                en: `**${j+1+i*10}.** ` +
                                    `${interaction.guild.members.cache.get(memberInvites.id).user.toString()} - ` +
                                    `**${totalInvitesCounter(memberInvites).toLocaleString()}** ` +
                                    `(**${memberInvites.invites.normal}** invited, ` +
                                    `**${memberInvites.invites.left}** left, ` +
                                    `**${memberInvites.invites.fake}** invalid, ` +
                                    `**${memberInvites.invites.bonus}** bonus)`
                            })
                        }).join("\n")
                    )

                    if(i > 0 && membersLeaderboardPages.length >= 10) {
                        messageButtons.push(
                            new ButtonBuilder()
                                .setCustomId(`invites.leaderboard.0`)
                                .setEmoji("⏪")
                                .setLabel(client.translate({ fr: "Première page", en: "First page" }))
                                .setStyle(ButtonStyle.Secondary)
                        )
                    }; if(i > 0) {
                        messageButtons.push(
                            new ButtonBuilder()
                                .setCustomId(`invites.leaderboard.${i-1}`)
                                .setEmoji("◀️")
                                .setLabel(client.translate({ fr: "Page précédente", en: "Previous page" }))
                                .setStyle(ButtonStyle.Secondary)
                        )
                    }; if(membersLeaderboardPages.length-i > 1) {
                        messageButtons.push(
                            new ButtonBuilder()
                                .setCustomId(`invites.leaderboard.${i+1}`)
                                .setEmoji("▶️")
                                .setLabel(client.translate({ fr: "Page suivante", en: "Next page" }))
                                .setStyle(ButtonStyle.Secondary)
                        )
                    }; if(membersLeaderboardPages.length-i > 1 && membersLeaderboardPages.length >= 10) {
                        messageButtons.push(
                            new ButtonBuilder()
                                .setCustomId(`invites.leaderboard.${membersLeaderboardPages.length-1}`)
                                .setEmoji("⏩")
                                .setLabel(client.translate({ fr: "Dernière page", en: "Last page" }))
                                .setStyle(ButtonStyle.Secondary)
                        )
                    };
                    if(messageButtons.length) messageActionRaws.push(
                        new ActionRowBuilder().addComponents(messageButtons)
                    )

                return { embeds: [embed], components: messageActionRaws };
            });
        
        if(membersLeaderboardPages.length == 0) {
            let embed = new EmbedBuilder()
                .setColor(Colors.Orange)
                .setAuthor({ name: "👑 Leaderboard - " + interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setDescription(client.translate({
                    fr: "❌ - **Aucun membre n'est classé.***",
                    en: "❌ - ***There are no ranked members.***"
                }))
            return await interaction.editReply({ embeds: [embed] });
        };

        let i = 0;
        while(i < membersLeaderboardPages.length) {
            let isClicked = true;
            let message = await interaction.editReply(membersLeaderboardPages[i]).catch(()=>'');
            if(membersLeaderboardPages.length == 1) break;
            await message.awaitMessageComponent({
                filter: (i) => {
                    return i.customId.startsWith("invites.leaderboard") && i.user.id == interaction.user.id && i.isButton();
                }, time: 30000
            }).then((i) => {
                i = parseInt(i.customId.split(".")[1]);
                return i.deferUpdate();
            }).catch(()=>{ isClicked = false });
            if(!isClicked) {
                interaction.editReply({ embeds: membersLeaderboardPages[i].embeds, components: [] });
                break;
            }
        }; 
            
        function totalInvitesCounter(inviterProfile) {
            return Object.values(inviterProfile.invites).reduce((pre, curr) => pre + curr, 0)
        };
    }
};