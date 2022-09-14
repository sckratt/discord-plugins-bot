const { Client, Interaction, InteractionType, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, Colors } = require('discord.js');
/**
 * @param {Client} client 
 * @param {Interaction} interaction
 */
module.exports = async (client, interaction) => {
    const db = client.db("invite-logger");

    if(!interaction.guild || !interaction.guild.available || !interaction.guild.id || interaction.guild.id !== client.config.guildId) return;
    
    if(interaction.type === InteractionType.MessageComponent) {
        if(interaction.isButton()) {
            if(!interaction.customId.startsWith("invite-logger")) return;

            const action = interaction.customId.split(".")[1];
            const member = interaction.guild.members.cache.get(interaction.customId.split(".")[2]);
            const author = interaction.guild.members.cache.get(interaction.customId.split(".")[3]);
            if(interaction.user.id !== author.user.id) return;
            if(!member) return interaction.update({ embeds: [client.utils.embeds.error(client.translate({
                fr: "Cet utilisateur a quitté le serveur. Sa page n'est plus consultable.",
                en: "This user has left the server. His profile is no longer searchable."
            }))], components: [] });

            if(!await db.has(`users.${member.user.id}`)) {
                await db.set(`users.${member.user.id}`, {
                    id: member.user.id,
                    joins: [{
                        at: member.joinedAt,
                        by: undefined,
                        inviteCode: undefined,
                        hasLeft: false
                    }],
                    invites: {
                        normal: 0,
                        left: 0,
                        fake: 0,
                        bonus: 0
                    }
                })
            };

            if(action == "invited-history") {
                const invitedUsers = Object.values(await db.get("users"))
                    .filter(u => u.joins?.map(j => j.by).includes(member.user.id) );
                let invites = [];
                invitedUsers.forEach((u) => {
                    u.joins
                    .filter(j => j.by == member.user.id)
                    .forEach(j => {
                        Object.assign(j, { id: u.id });
                        invites.push(j);
                    });
                });

                let backButton = new ButtonBuilder()
                    .setCustomId(`invite-logger.info.${member.user.id}.${author.user.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel(client.translate({
                        fr: "Retour aux informations du membre",
                        en: "Back to the members infos"
                    }))
                let backButtonActionRaw = new ActionRowBuilder()
                    .addComponents([ backButton ])
                    
                let pages = [];
                let page = [];
                invites.sort((a,b) => b.at - a.at);
                let userUpdatedIDs = [];
                var definitiveInvites = [];
                for(let j of invites) {
                    let userDB = await db.get(`users.${j.id}`)
                    if(interaction.guild.members.cache.has(j.id)) {
                        var left = false;
                        if(userDB.joins[userDB.joins.length-1].by !== member.user.id) var fake = true;
                        else if(userUpdatedIDs.includes(j.id)) var fake = true;
                        else {
                            var fake = false;
                            userUpdatedIDs.push(j.id);
                        };
                    } else { var fake = false; var left = true; };
                    definitiveInvites.push({
                        at: j.at,
                        by: j.by,
                        inviteCode: j.inviteCode,
                        id: j.id,
                        fake: fake,
                        left: left
                    })
                };

                for(let j of definitiveInvites) {
                    page.push(j);
                    if(page.length >= 20) {
                        let resolvedPage = await Promise.all(page.map(async (join) => {
                            let user = client.users.cache.get(join.id) || await client.users.fetch(join.id);
                            const joinedTimestamp = `${new Date(join.at).getTime()}`.slice(0, -3);
                            return `${join.left ? "❌" : join.fake ? "💩" : "✅"} ${user.toString()} - **${join.inviteCode}** - <t:${joinedTimestamp}:R>`;
                        }));
                        let pageEmbed = new EmbedBuilder()
                            .setColor(Colors.Blue)
                            .setAuthor({
                                name: member.user.tag,
                                iconURL: member.user.displayAvatarURL()
                            }).setDescription(
                                resolvedPage.join("\n") || translate({ fr: "❌ **Aucun**", en: "❌ **None**" })
                            )
                        pages.push(pageEmbed);
                        page = [];
                    };
                };
                
                if(page.length > 0) {
                    let resolvedPage = await Promise.all(page.map(async (join) => {
                        let user = client.users.cache.get(join.id) || await client.users.fetch(join.id);
                        const joinedTimestamp = `${new Date(join.at).getTime()}`.slice(0, -3);
                        return `${join.left ? "❌" : join.fake ? "💩" : "✅"} ${user.toString()} - **${join.inviteCode}** - <t:${joinedTimestamp}:R>`
                    }));
                    let pageEmbed = new EmbedBuilder()
                        .setColor(Colors.Blue)
                        .setAuthor({
                            name: member.user.tag,
                            iconURL: member.user.displayAvatarURL()
                        }).setDescription(
                            resolvedPage.join("\n") || translate({ fr: "❌ **Aucun**", en: "❌ **None**" })
                        )
                    pages.push(pageEmbed);
                };

                if(definitiveInvites.length == 0) {
                    pages.push(
                        new EmbedBuilder()
                            .setColor(Colors.Red)
                            .setAuthor({
                                name: member.user.tag,
                                iconURL: member.user.displayAvatarURL()
                            }).setDescription(client.translate({
                                fr: `❌ - **${member.user.id == author.user.id ? "Vous n'avez" : member.user.toString() + "n'a"} invité aucun membre.**`,
                                en: `❌ - **${member.user.id == author.user.id ? "You have not" : member.user.toString() + "has not"} invited any member.**`
                            }))
                    );
                };

                await interaction.update({ embeds: pages, components: [backButtonActionRaw] });
            } else if(action == "info") {
                
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
        
                    lastInvitedMembers.sort((a,b) => b.joins[b.joins.length-1].at - a.join[a.join.length-1].at);
                    
                    for(let i=0; i<lastInvitedMembers.length; i++) {
                        const u = lastInvitedMembers[i];
                        const user = client.users.cache.get(u.id) || await client.users.fetch(u.id).catch(()=>'');
                        const type = interaction.guild.members.cache.has(u.id) ? u.joins[u.joins.length-1].by == member.user.id ? "normal" : "fake" : "left";
                        lastInvitedMembers[i] = { mInvites: u, user, type };
                    };
        
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

                    await interaction.update({ embeds: [embed], components: [invitedHistoryActionRaw] }).catch(()=>'');
                } catch (err) {
                    throw err;
                }
            } else if(action == "invites-list") {

                let invitesArray = Array.from(await interaction.guild.invites.fetch())
                    .map(i => i[1])
                    .filter(i => i.inviter.id == member.user.id)
                    .sort((a,b) => b.createdTimestamp - a.createdTimestamp)
                    .map(i => {
                        return (i.expiresAt ? `⏱ ` : "") + `**${i.code}** - ` +
                            `${i.channel.toString()} - ` +
                            `**${i.uses}** clicks - ` +
                            `<t:${i.createdTimestamp.toString().slice(0, -3)}:R>`
                    });
                let pages = [];
                let page = [];

                for(let i of invitesArray) {
                    page.push(i);
                    if(page.length > 10) {
                        pages.push(page);
                        page = [];
                    }
                };

                if(page.length > 0) {
                    let pageEmbed = new EmbedBuilder()
                        .setColor(Colors.Blue)
                        .setAuthor({
                            name: member.user.tag,
                            iconURL: member.user.displayAvatarURL()
                        }).setDescription( page.join("\n") )
                    pages.push(pageEmbed);
                };
                if(pages.length == 0) {
                    pages.push(
                        new EmbedBuilder()
                            .setColor(Colors.Red)
                            .setAuthor({
                                name: member.user.tag,
                                iconURL: member.user.displayAvatarURL()
                            }).setDescription(client.translate({
                                fr: `❌ - ${member.user.toString()} **n'a aucune invitation.**`,
                                en: `❌ - ${member.user.toString()} **doesn't have any invitation.**`
                            }))
                    );
                };
                
                let backButton = new ButtonBuilder()
                    .setCustomId(`invite-logger.info.${member.user.id}.${author.user.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel(client.translate({
                        fr: "Retour aux informations du membre",
                        en: "Back to the members infos"
                    }))
                let backButtonActionRaw = new ActionRowBuilder()
                    .addComponents([backButton])
        
                await interaction.update({ embeds: pages, components: [backButtonActionRaw] })
            } else if(action == "bonus-history") {
                const memberInvites = await db.get(`users.${member.user.id}`);

                let backButton = new ButtonBuilder()
                    .setCustomId(`invite-logger.info.${member.user.id}.${author.user.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel(client.translate({
                        fr: "Retour aux informations du membre",
                        en: "Back to the members infos"
                    }))
                let backButtonActionRaw = new ActionRowBuilder()
                    .addComponents([backButton])


                let pages = [];
                let page = [];

                if(!memberInvites.bonusHistory.length) {
                    let emptyEmbed = new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setAuthor({
                            name: member.user.tag,
                            iconURL: member.user.displayAvatarURL()
                        }).setDescription(client.translate({
                            fr: `❌ - ${member.user.id == author.user.id ? "**Vous**" : member.user.toString()} n'avez jamais eu d'invitations bonus.`,
                            en: `❌ - ${member.user.id == author.user.id ? "**You**" : member.user.toString()} never got any bonus invite.`
                        }))

                    return await interaction.update({ embeds: [emptyEmbed], components: [backButtonActionRaw] }).catch(()=>'');
                };

                memberInvites.bonusHistory.reverse().forEach(bonus => {
                    page.push(bonus);
                    if(page.length >= 10) {
                        pages.push(page);
                        page = [];
                    }
                }); if(page.length > 0) pages.push(page);

                pages = await Promise.all(pages.map(async (page) => {
                    let p = await Promise.all(page.map(async (el) => {
                        let user = client.users.cache.get(el.by) || await client.users.fetch(el.by);
                        let emoji = el.action == "add" ? "📈" : "📉";
                        let amount = "**" + el.amount.toLocaleString(client.config.language) + "** " + (el.action == "add" ? client.translate({ fr: "ajoutées", en: "added" }) : client.translate({ fr: "retirées", en: "removed" }));
                        let date = `<t:${el.at.toString().slice(0, -3)}:d>`
                        let timestamp = `<t:${el.at.toString().slice(0, -3)}:R>`
                        let reason = el.reason ? `\n\`\`↪\`\` __**${client.translate({ fr: "Raison", en: "Reason" })} :**__ ${el.reason}` : "";

                        return client.translate({
                            fr: `${emoji} ${amount} par ${user.toString()}\n` +
                                `\`\`↪\`\` Le ${date} - ${timestamp}${reason}`,
                            en: `${emoji} ${amount} by ${user.toString()}\n` +
                                `\`\`↪\`\` The ${date} - ${timestamp}${reason}`
                        })
                    }));
                    return new EmbedBuilder()
                        .setColor(Colors.Blue)
                        .setAuthor({
                            name: member.user.tag,
                            iconURL: member.user.displayAvatarURL()
                        }).setDescription(
                            p.join("\n\n")
                        )
                }));

                await interaction.update({ embeds: pages, components: [backButtonActionRaw] }).catch(()=>'');
            };
        };

    };

};