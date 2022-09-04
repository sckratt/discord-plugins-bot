const { Client, GuildMember, Colors, EmbedBuilder, ChannelType, UserFlags } = require('discord.js');
/**
 * @param {Client} client 
 * @param {GuildMember} member
 */
module.exports = async (client, member) => {
    if(member.guild.id !== client.config.guildId || member.user.bot) return;
    const db = client.db("invite-logger");
    const config = require('../../config');

    await member.guild.fetchVanityData().catch(()=>'');
    
    try {
        var invitesdb = Object.values(await db.get("invites"));
        var invite = (await member.guild.invites.fetch())
            .find(i => {
                let invitedb = invitesdb.find(idb => idb.code == (isVanity(i) ? "vanity" : i.code));
                return invitedb && i.uses > invitedb.uses;
            });
    } catch (err) {
        console.error(err);
        throw new Error(client.translate({
            fr: "Le bot n'a pas la permissions de voir les invitations. Cette permissions est obligatoire pour son bon fonctionnement.",
            en: "The bot does not have permissions to fetch invites. This permission is mandatory for the good performence."
        }));
    };

    if(!invite) {
        if(!await db.has(`users.${member.user.id}`)) {
            await db.set(`users.${member.user.id}`, {
                id: member.user.id,
                joins: [],
                bonusHistory: [],
                invites: {
                    normal: 0,
                    left: 0,
                    fake: 0,
                    bonus: 0
                }
            })
        };
        const memberInvites = await getMemberInvites(member.user);
        if(memberInvites.joins.length) {
            let tempJoins = memberInvites.joins;
            if(!tempJoins[tempJoins.length-1].hasLeft) {
                tempJoins[tempJoins.length-1].hasLeft = true;
                await db.set(`users.${member.user.id}.joins`, tempJoins);
                if(tempJoins[tempJoins.length-1].by && tempJoins[tempJoins.length-1].by !== member.user.id && await db.has(`users.${tempJoins[tempJoins.length-1].by}`)) {
                    await db.sub(`users.${tempJoins[tempJoins.length-1].by}.invites.fake`, 1);
                }
            } else if(await db.has(`users.${tempJoins[tempJoins.length-1].by}`)) {
                let doneMembers = [member.user.id, tempJoins[tempJoins.length-1].by];
                tempJoins.forEach(async (j) => {
                    if(!doneMembers.includes(j.by) && await db.has(`users.${j.by}`)) {
                        doneMembers.push(j.by);
                        await db.add(`users.${j.by}.invites.left`, 1);
                        await db.sub(`users.${j.by}.invites.fake`, 1);
                    };
                });
            }
        };
        await db.push(`users.${member.user.id}.joins`, {
            at: new Date(),
            by: undefined,
            inviteCode: undefined,
            hasLeft: false
        });

        if(!getChannel()) throw new Error(client.translate({
            fr: "Impossible trouver le salon ayant l'id " + config.channelId,
            en: "Could not find channel with id " + config.channelId
        }));
        let message = {
            content: config.message.joined.unknown
                .replace(/{@user}/g, member.user.toString())
                .replace(/{#user}/g, member.user.tag)
                .replace(/{.user}/g, member.user.username)
                .replace(/{@inviter}/g, client.translate({ fr: "inconnu", en: "unknown" }))
                .replace(/{#inviter}/g, client.translate({ fr: "inconnu", en: "unknown" }))
                .replace(/{.inviter}/g, client.translate({ fr: "inconnu", en: "unknown" }))
                .replace(/{inviteCount}/g, client.translate({ fr: "inconnu", en: "unknown" }))
                .replace(/{memberCount}/g, member.guild.memberCount)
                .replace(/{inviteCode}/g, client.translate({ fr: "inconnu", en: "unknown" }))
                .replace(/{inviteURL}/g, client.translate({ fr: "inconnu", en: "unknown" }))
        };
        if(config.embed.enabled) {
            const embed = new EmbedBuilder()
                .setColor(Colors[config.embed.colors.unknown] || Colors.Orange)
                .setDescription(message.content)
            message = { embeds: [embed] };
        };
        
        await getChannel().send(message).catch(()=>'');
    } else if(isVanity(invite)) {
        if(!await db.has(`users.${member.user.id}`)) {
            await db.set(`users.${member.user.id}`, {
                id: member.user.id,
                joins: [],
                bonusHistory: [],
                invites: {
                    normal: 0,
                    left: 0,
                    fake: 0,
                    bonus: 0
                }
            })
        };
        const memberInvites = await getMemberInvites(member.user);

        if(memberInvites.joins.length) {
            let tempJoins = memberInvites.joins;
            if(!tempJoins[tempJoins.length-1].hasLeft) {
                tempJoins[tempJoins.length-1].hasLeft = true;
                await db.set(`users.${member.user.id}.joins`, tempJoins);
                if(tempJoins[tempJoins.length-1].by && tempJoins[tempJoins.length-1].by !== member.user.id && await db.has(`users.${tempJoins[tempJoins.length-1].by}`)) {
                    await db.sub(`users.${tempJoins[tempJoins.length-1].by}.invites.fake`, 1);
                }
            } else if(await db.has(`users.${tempJoins[tempJoins.length-1].by}`)) {
                let doneMembers = [member.user.id, tempJoins[tempJoins.length-1].by];
                tempJoins.forEach(async (j) => {
                    if(!doneMembers.includes(j.by) && await db.has(`users.${j.by}`)) {
                        doneMembers.push(j.by);
                        await db.add(`users.${j.by}.invites.left`, 1);
                        await db.sub(`users.${j.by}.invites.fake`, 1);
                    };
                });
            }
        };
        
        await db.push(`users.${member.user.id}.joins`, {
            at: new Date(),
            by: undefined,
            inviteCode: "vanity",
            hasLeft: false
        });

        if(!getChannel()) throw new Error(client.translate({
            fr: "Impossible trouver le salon ayant l'id " + config.channelId,
            en: "Could not find channel with id " + config.channelId
        }));
        let message = {
            content: config.message.joined.vanity
                .replace(/{@user}/g, member.user.toString())
                .replace(/{#user}/g, member.user.tag)
                .replace(/{.user}/g, member.user.username)
                .replace(/{@inviter}/g, client.translate({ fr: "URL personnalisée", en: "vanity URL" }))
                .replace(/{#inviter}/g, client.translate({ fr: "URL personnalisée", en: "vanity URL" }))
                .replace(/{.inviter}/g, client.translate({ fr: "URL personnalisée", en: "vanity URL" }))
                .replace(/{inviteCount}/g, client.translate({ fr: "inconnu", en: "unknown" }))
                .replace(/{memberCount}/g, member.guild.memberCount)
                .replace(/{inviteCode}/g, invite.code)
                .replace(/{inviteURL}/g, invite.url)
        };
        if(config.embed.enabled) {
            const embed = new EmbedBuilder()
                .setColor(Colors[config.embed.colors.vanity] || Colors.Blue)
                .setDescription(message.content)
            message = { embeds: [embed] };
        };
        
        await getChannel().send(message).catch(()=>'');
    } else if(invite.inviterId) {
        if(!await db.has(`users.${member.user.id}`)) {
            await db.set(`users.${member.user.id}`, {
                id: member.user.id,
                joins: [],
                bonusHistory: [],
                invites: {
                    normal: 0,
                    left: 0,
                    fake: 0,
                    bonus: 0
                }
            })
        };
        const memberInvites = await getMemberInvites(member.user);

        if(!invite.inviterId) {
            if(memberInvites.joins.length) {
                let tempJoins = memberInvites.joins;
                if(!tempJoins[tempJoins.length-1].hasLeft) {
                    tempJoins[tempJoins.length-1].hasLeft = true;
                    await db.set(`users.${member.user.id}.joins`, tempJoins);
                    if(tempJoins[tempJoins.length-1].by && tempJoins[tempJoins.length-1].by !== member.user.id && await db.has(`users.${tempJoins[tempJoins.length-1].by}`)) {
                        await db.sub(`users.${tempJoins[tempJoins.length-1].by}.invites.fake`, 1);
                    }
                } else if(await db.has(`users.${tempJoins[tempJoins.length-1].by}`)) {
                    let doneMembers = [member.user.id, tempJoins[tempJoins.length-1].by];
                    tempJoins.forEach(async (j) => {
                        if(!doneMembers.includes(j.by) && await db.has(`users.${j.by}`)) {
                            doneMembers.push(j.by);
                            await db.add(`users.${j.by}.invites.left`, 1);
                            await db.sub(`users.${j.by}.invites.fake`, 1);
                        };
                    });
                }
            };
        
            await db.push(`users.${member.user.id}.joins`, {
                at: new Date(),
                by: undefined,
                inviteCode: invite.code,
                hasLeft: false
            });
    
            if(!getChannel()) throw new Error(client.translate({
                fr: "Impossible trouver le salon ayant l'id " + config.channelId,
                en: "Could not find channel with id " + config.channelId
            }));
            let message = {
                content: config.message.joined.unknown
                    .replace(/{@user}/g, member.user.toString())
                    .replace(/{#user}/g, member.user.tag)
                    .replace(/{.user}/g, member.user.username)
                    .replace(/{@inviter}/g, client.translate({ fr: "inconnu", en: "unknown" }))
                    .replace(/{#inviter}/g, client.translate({ fr: "inconnu", en: "unknown" }))
                    .replace(/{.inviter}/g, client.translate({ fr: "inconnu", en: "unknown" }))
                    .replace(/{inviteCount}/g, client.translate({ fr: "inconnu", en: "unknown" }))
                    .replace(/{memberCount}/g, member.guild.memberCount)
                    .replace(/{inviteCode}/g, invite.code)
                    .replace(/{inviteURL}/g, invite.url)
            };
            if(config.embed.enabled) {
                const embed = new EmbedBuilder()
                    .setColor(Colors[config.embed.colors.unknown] || Colors.Orange)
                    .setDescription(message.content)
                message = { embeds: [embed] };
            };
            
            await getChannel().send(message).catch(()=>'');
        } else if(invite.inviterId == member.user.id) {
            if(memberInvites.joins.length) {
                let tempJoins = memberInvites.joins;
                if(!tempJoins[tempJoins.length-1].hasLeft) {
                    tempJoins[tempJoins.length-1].hasLeft = true;
                    await db.set(`users.${member.user.id}.joins`, tempJoins);
                    if(tempJoins[tempJoins.length-1].by && tempJoins[tempJoins.length-1].by !== member.user.id && await db.has(`users.${tempJoins[tempJoins.length-1].by}`)) {
                        await db.sub(`users.${tempJoins[tempJoins.length-1].by}.invites.fake`, 1);
                    }
                } else if(await db.has(`users.${tempJoins[tempJoins.length-1].by}`)) {
                    let doneMembers = [member.user.id, tempJoins[tempJoins.length-1].by];
                    tempJoins.forEach(async (j) => {
                        if(!doneMembers.includes(j.by) && await db.has(`users.${j.by}`)) {
                            doneMembers.push(j.by);
                            await db.add(`users.${j.by}.invites.left`, 1);
                            await db.sub(`users.${j.by}.invites.fake`, 1);
                        };
                    });
                }
            };
        
            await db.push(`users.${member.user.id}.joins`, {
                at: new Date(),
                by: member.user.id,
                inviteCode: invite.code,
                hasLeft: false
            });
    
            if(!getChannel()) throw new Error(client.translate({
                fr: "Impossible trouver le salon ayant l'id " + config.channelId,
                en: "Could not find channel with id " + config.channelId
            }));
            let message = {
                content: config.message.joined['self-invite']
                    .replace(/{@user}/g, member.user.toString())
                    .replace(/{#user}/g, member.user.tag)
                    .replace(/{.user}/g, member.user.username)
                    .replace(/{@inviter}/g, member.user.toString())
                    .replace(/{#inviter}/g, member.user.tag)
                    .replace(/{.inviter}/g, member.user.username)
                    .replace(/{inviteCount}/g, totalInvitesCounter(memberInvites))
                    .replace(/{memberCount}/g, member.guild.memberCount)
                    .replace(/{inviteCode}/g, invite.code)
                    .replace(/{inviteURL}/g, invite.url)
            };
            if(config.embed.enabled) {
                const embed = new EmbedBuilder()
                    .setColor(Colors[config.embed.colors['self-invite']] || Colors.Orange)
                    .setDescription(message.content)
                message = { embeds: [embed] };
            };
            
            await getChannel().send(message).catch(()=>'');
        } else {
            if(!await db.has(`users.${invite.inviterId}`)) {
                await db.set(`users.${invite.inviterId}`, {
                    id: invite.inviterId,
                    joins: [{
                        at: member.guild.members.cache.get(invite.inviterId)?.joinedAt || new Date(),
                        by: undefined,
                        inviteCode: undefined,
                        hasLeft: !!member.guild.members.cache.has(invite.inviterId) || !!await member.guild.members.fetch(invite.inviterId).catch(()=>'')
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
            if(!await db.has(`users.${member.user.id}`)) {
                await db.set(`users.${member.user.id}`, {
                    id: member.user.id,
                    joins: [],
                    bonusHistory: [],
                    invites: {
                        normal: 0,
                        left: 0,
                        fake: 0,
                        bonus: 0
                    }
                })
            };
            const memberInvites = await getMemberInvites(member.user);
    
            if(memberInvites.joins.length) {
                let tempJoins = memberInvites.joins;
                if(!tempJoins[tempJoins.length-1].hasLeft) {
                    tempJoins[tempJoins.length-1].hasLeft = true;
                    await db.set(`users.${member.user.id}.joins`, tempJoins);
                    if(tempJoins[tempJoins.length-1].by && tempJoins[tempJoins.length-1].by !== member.user.id && tempJoins[tempJoins.length-1].by !== invite.inviterId && await db.has(`users.${tempJoins[tempJoins.length-1].by}`)) {
                        await db.sub(`users.${tempJoins[tempJoins.length-1].by}.invites.fake`, 1);
                    }
                } else {
                    if(await db.has(`users.${invite.inviterId}`)) {
                        if(tempJoins.map(j => j.by).includes(invite.inviterId)) await db.add(`users.${invite.inviterId}.invites.left`, 1);
                        else await db.add(`users.${invite.inviterId}.invites.normal`, 1);
                    }
                    let doneMembers = [member.user.id, invite.inviterId, tempJoins[tempJoins.length-1].by];
                    tempJoins.forEach(async (j) => {
                        if(!doneMembers.includes(j.by) && await db.has(`users.${j.by}`)) {
                            doneMembers.push(j.by);
                            await db.add(`users.${j.by}.invites.left`, 1);
                            await db.sub(`users.${j.by}.invites.fake`, 1);
                        };
                    });
                }
            } else await db.add(`users.${invite.inviterId}.invites.normal`, 1);
            
            await db.push(`users.${member.user.id}.joins`, {
                at: new Date(),
                by: invite.inviterId,
                inviteCode: invite.code,
                hasLeft: false
            });

            if(!getChannel()) throw new Error(client.translate({
                fr: "Impossible trouver le salon ayant l'id " + config.channelId,
                en: "Could not find channel with id " + config.channelId
            }));
            let message = {
                content: config.message.joined.success
                    .replace(/{@user}/g, member.user.toString())
                    .replace(/{#user}/g, member.user.tag)
                    .replace(/{.user}/g, member.user.username)
                    .replace(/{@inviter}/g, invite.inviter.toString())
                    .replace(/{#inviter}/g, invite.inviter.tag)
                    .replace(/{.inviter}/g, invite.inviter.username)
                    .replace(/{inviteCount}/g, totalInvitesCounter(await getMemberInvites(invite.inviter)))
                    .replace(/{memberCount}/g, member.guild.memberCount)
                    .replace(/{inviteCode}/g, invite.code)
                    .replace(/{inviteURL}/g, invite.url)
            };
            if(config.embed.enabled) {
                const embed = new EmbedBuilder()
                    .setColor(Colors[config.embed.colors.success] || Colors.Green)
                    .setDescription(message.content)
                message = { embeds: [embed] };
            };
            
            await getChannel().send(message).catch(()=>'');
        }
    };


    function getChannel() {
        return member.guild.channels.cache
            .filter(c => c.type === ChannelType.GuildText)
            .get(config.channelId)
    };
    async function getMemberInvites(user) {
        return await db.get(`users.${user.id}`);
    };
    function totalInvitesCounter(inviterProfile) {
        return Object.values(inviterProfile.invites).reduce((pre, curr) => pre + curr, 0)
    };
    function isVanity(invite) {
        return member.guild.features.includes("VANITY_URL") && invite.code == guild.vanityURLCode;
    };
};