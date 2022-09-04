const { Client, CommandInteraction, SlashCommandSubcommandBuilder, EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits, InviteTargetType } = require('discord.js');

module.exports = {
    /**
     * @param {Client} client 
     * @returns {SlashCommandSubcommandBuilder}
     */
    render() {
        return new SlashCommandSubcommandBuilder()
            .setName('info')
            .setDescription("Get informations about invites of a member")
            .setDescriptionLocalizations({
                fr: "Obtenez des informations sur les invitations d'un membre"
            }).addUserOption(option =>
                option.setName("user")
                    .setNameLocalizations({ fr: "utilisateur" })
                    .setDescription("The member you want to get the invites infos")
                    .setDescriptionLocalizations({ fr: "L'utilisateur dont vous voulez récupérer les informations" })
            )
    },
    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     */
    async execute(client, interaction) {
        if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return;
        await interaction.deferReply();
        const db = client.db("invite-logger");
        if(!await db.has("users")) await db.set("users", {});
        if(!await db.has("invites")) await db.set("invites", {});

        const member = interaction.options?.getMember('user') || interaction.member;

        if(!await db.has(`users.${member.user.id}`)) {
            await db.set(`users.${member.user.id}`, {
                id: member.user.id,
                joins: [{
                    at: member.joinedAt,
                    by: undefined,
                    inviteCode: undefined,
                    hasLeft: false
                }],
                bonusHistory: [],
                invites: {
                    normal: 0,
                    left: 0,
                    fake: 0,
                    bonus: 0
                }
            })
        };

        if(!member || !member.user?.id) return await interaction.editReply({ embeds: [
            client.utils.embeds.error(client.translate({
                fr: "Le membre n'a pas été trouvé",
                en: "The member has not been found"
            }))
        ] });

        const memberInvites = await db.get(`users.${member.user.id}`);

        const regularInvites = client.translate({
            fr: `✅ \`${memberInvites.invites.normal}\` Invités\n` +
                `✨ \`${memberInvites.invites.bonus}\` Bonus\n` +
                `💩 \`${memberInvites.invites.fake}\` Invalidées\n` +
                `❌ \`${memberInvites.invites.left}\` Partis`,
            en: `✅ \`${memberInvites.invites.normal}\` Invited\n` +
                `✨ \`${memberInvites.invites.bonus}\` Bonus\n` +
                `💩 \`${memberInvites.invites.fake}\` Invalid\n` +
                `❌ \`${memberInvites.invites.left}\` Left`
        });

        try {

            let lastInvitedMembers = [];
            Object.values(await db.get(`users`))
                .filter(u => u.joins.filter(j => j.by == member.user.id).length)
                .forEach(u => lastInvitedMembers.push(u))

            for(let i=0; i<lastInvitedMembers.length; i++) {
                const u = lastInvitedMembers[i];
                const user = client.users.cache.get(u.id) || await client.users.fetch(u.id).catch(()=>'');
                const type = interaction.guild.members.cache.has(u.id) ? u.joins[u.joins.length-1].by == member.user.id ? "normal" : "fake" : "left";
                lastInvitedMembers[i] = { mInvites: u, user, type };
            };

            lastInvitedMembers.sort((a,b) => b.joins[b.joins.length-1].at - a.join[a.join.length-1].at);

            const embed = new EmbedBuilder()
                .setColor(Colors.Blue)
                .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                .setFields([
                    {
                        name: client.translate({ fr: "__Invité par__", en: "__Invited by__" }),
                        value: memberInvites.joins.length
                                    ? memberInvites.joins[memberInvites.joins.length-1].code == "vanity"
                                        ? client.translate({ fr: "URL personnalisée", en: "Vanity URL" })
                                    : memberInvites.joins[memberInvites.joins.length-1].by
                                        ? (client.users.cache.get(memberInvites.joins[memberInvites.joins.length-1].by) ||
                                        await client.users.fetch(memberInvites.joins[memberInvites.joins.length-1].by)).toString()
                                    : client.translate({ fr: "❌ **Introuvable**", en: "❌ **Not found**" })
                                : client.translate({ fr: "❌ **Introuvable**", en: "❌ **Not found**" }),
                        inline: true
                    },{ name: "\u200B", value: "\u200B", inline: true },{
                        name: client.translate({ fr: "__Rejoint le__", en: "__Joined on__" }),
                        value: `<t:${member.joinedTimestamp.toString().slice(0, -3)}:R>`,
                        inline: true
                    },{
                        name: client.translate({ fr: "__Invitations régulières__", en: "__Regular invites__" }),
                        value: regularInvites
                    },{
                        name: client.translate({ fr: "__Invitations actives__", en: "__Active invites__" }),
                        value: Array.from(await interaction.guild.invites.fetch())
                                .map(i => i[1])
                                .filter(i => i.inviter.id == member.user.id)
                                .sort((a,b) => b.createdTimestamp - a.createdTimestamp)
                                .slice(0, 10).map(i => {
                                    return (i.expiresAt ? `⏱ ` : "") + `**${i.code}** - ${i.channel.toString()} - <t:${i.createdTimestamp.toString().slice(0, -3)}:R>`
                                }).join("\n") || client.translate({ fr: "❌ **Aucune**", en: "❌ **None**" })
                    },{
                        name: client.translate({ fr: "__Derniers membres invités__", en: "__Last invited members__" }),
                        value: lastInvitedMembers.map(({ mInvites, user, type }) => {
                            const joinedTimestamp = `${new Date(mInvites.joins[mInvites.joins.length-1].at).getTime()}`.slice(0, -3);
                            return (type == "normal" ? "✅ " : type == "left" ? "❌ " : "💩 ") +
                                user.toString() +
                                ` - **${mInvites.joins[mInvites.joins.length-1].inviteCode}**` +
                                ` - <t:${joinedTimestamp}:R>`
                        }).join("\n") || client.translate({ fr: "❌ **Aucun**", en: "❌ **None**" })
                    }
                ])

            const invitedHistoryButton = new ButtonBuilder()
                .setCustomId(`invite-logger.invited-history.${member.user.id}.${interaction.user.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel(client.translate({
                    fr: "Voir l'historique des membres invités",
                    en: "View invited members history"
                }))
            
            const invitesHistoryButton = new ButtonBuilder()
                .setCustomId(`invite-logger.invites-list.${member.user.id}.${interaction.user.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel(client.translate({
                    fr: "Voir l'historique des invitations",
                    en: "View active invites history"
                }))
            
            const bonusHistoryButton = new ButtonBuilder()
                .setCustomId(`invite-logger.bonus-history.${member.user.id}.${interaction.user.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel(client.translate({
                    fr: "Voir l'historique des invitations bonus",
                    en: "View bonus invites history"
                }))
                
            let invitedHistoryActionRaw = new ActionRowBuilder()
                .addComponents([ invitedHistoryButton, invitesHistoryButton, bonusHistoryButton ])

            await interaction.editReply({ embeds: [embed], components: [invitedHistoryActionRaw] }).catch(()=>'');
        } catch (err) {
            throw err;
        }
    }
};