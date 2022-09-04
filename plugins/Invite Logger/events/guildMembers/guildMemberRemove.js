const { Client, GuildMember, Colors, EmbedBuilder, ChannelType } = require('discord.js');
/**
 * @param {Client} client 
 * @param {GuildMember} member
 */
module.exports = async (client, member) => {
    if(member.guild.id !== client.config.guildId || member.user.bot) return;

    const db = client.db("invite-logger");
    const config = require('../../config');
    
    if(!await db.has(`users.${member.user.id}`)) {
        return await db.set(`users.${member.user.id}`, {
            id: member.user.id,
            joins: [], bonusHistory: [],
            invites: {
                normal: 0,
                left: 0,
                fake: 0,
                bonus: 0
            }
        })
    };

    await member.guild.fetchVanityData().catch(()=>'');

    var memberInvites = await db.get(`users.${member.user.id}`);
    const lastJoined = memberInvites.joins[memberInvites.joins.length-1]
    
    if(!lastJoined) {
        if(!getChannel()) throw new Error(client.translate({
            fr: "Impossible trouver le salon ayant l'id " + config.channelId,
            en: "Could not find channel with id " + config.channelId
        }));
        let message = {
            content: config.message.left.unknown
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
                .setColor(Colors[config.embed.colors.left] || Colors.Red)
                .setDescription(message.content)
            message = { embeds: [embed] };
        };
        
        await getChannel().send(message).catch(()=>'');
    } else if(lastJoined.inviteCode == "vanity") {
        memberInvites.joins[memberInvites.joins.length-1].hasLeft = true;
        await db.set(`users.${member.user.id}.joins`, memberInvites.joins);

        let doneMembers = [member.user.id];
        memberInvites.joins.forEach(async (j) => {
            if(!doneMembers.includes(j.by) && await db.has(`users.${j.by}`)) {
                doneMembers.push(j.by);
                await db.sub(`users.${j.by}.invites.left`, 1);
                await db.add(`users.${j.by}.invites.fake`, 1);
            };
        });
        
        if(!getChannel()) throw new Error(client.translate({
            fr: "Impossible trouver le salon ayant l'id " + config.channelId,
            en: "Could not find channel with id " + config.channelId
        }));
        let message = {
            content: config.message.left.vanity
                .replace(/{@user}/g, member.user.toString())
                .replace(/{#user}/g, member.user.tag)
                .replace(/{.user}/g, member.user.username)
                .replace(/{@inviter}/g, client.translate({ fr: "URL personnalisée", en: "vanity URL" }))
                .replace(/{#inviter}/g, client.translate({ fr: "URL personnalisée", en: "vanity URL" }))
                .replace(/{.inviter}/g, client.translate({ fr: "URL personnalisée", en: "vanity URL" }))
                .replace(/{inviteCount}/g, client.translate({ fr: "inconnu", en: "unknown" }))
                .replace(/{memberCount}/g, member.guild.memberCount)
                .replace(/{inviteCode}/g, member.guild.vanityURLCode)
                .replace(/{inviteURL}/g, `https://discord.gg/${member.guild.vanityURLCode}`)
        };
        if(config.embed.enabled) {
            const embed = new EmbedBuilder()
                .setColor(Colors[config.embed.colors.left] || Colors.Red)
                .setDescription(message.content)
            message = { embeds: [embed] };
        };
        
        await getChannel().send(message).catch(()=>'');
    } else if(!lastJoined.by) {
        memberInvites.joins[memberInvites.joins.length-1].hasLeft = true;
        await db.set(`users.${member.user.id}.joins`, memberInvites.joins);

        let doneMembers = [member.user.id];
        memberInvites.joins.forEach(async (j) => {
            if(!doneMembers.includes(j.by) && await db.has(`users.${j.by}`)) {
                doneMembers.push(j.by);
                await db.sub(`users.${j.by}.invites.left`, 1);
                await db.add(`users.${j.by}.invites.fake`, 1);
            };
        });
        
        if(!getChannel()) throw new Error(client.translate({
            fr: "Impossible trouver le salon ayant l'id " + config.channelId,
            en: "Could not find channel with id " + config.channelId
        }));
        let message = {
            content: config.message.left.unknown
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
                .setColor(Colors[config.embed.colors.left] || Colors.Red)
                .setDescription(message.content)
            message = { embeds: [embed] };
        };
        
        await getChannel().send(message).catch(()=>'');
    } else if(lastJoined.by == member.user.id) {
        memberInvites.joins[memberInvites.joins.length-1].hasLeft = true;
        await db.set(`users.${member.user.id}.joins`, memberInvites.joins);

        let doneMembers = [member.user.id];
        memberInvites.joins.forEach(async (j) => {
            if(!doneMembers.includes(j.by) && await db.has(`users.${j.by}`)) {
                doneMembers.push(j.by);
                await db.sub(`users.${j.by}.invites.left`, 1);
                await db.add(`users.${j.by}.invites.fake`, 1);
            };
        });
        
        if(!getChannel()) throw new Error(client.translate({
            fr: "Impossible trouver le salon ayant l'id " + config.channelId,
            en: "Could not find channel with id " + config.channelId
        }));
        let message = {
            content: config.message.left['self-invite']
                .replace(/{@user}/g, member.user.toString())
                .replace(/{#user}/g, member.user.tag)
                .replace(/{.user}/g, member.user.username)
                .replace(/{@inviter}/g, member.user.toString())
                .replace(/{#inviter}/g, member.user.tag)
                .replace(/{.inviter}/g, member.user.username)
                .replace(/{inviteCount}/g, totalInvitesCounter(memberInvites))
                .replace(/{memberCount}/g, member.guild.memberCount)
                .replace(/{inviteCode}/g, lastJoined.inviteCode)
                .replace(/{inviteURL}/g, `https://discord.gg/${lastJoined.inviteCode}`)
        };
        if(config.embed.enabled) {
            const embed = new EmbedBuilder()
                .setColor(Colors[config.embed.colors.left] || Colors.Red)
                .setDescription(message.content)
            message = { embeds: [embed] };
        };
        
        await getChannel().send(message).catch(()=>'');
    } else {
        memberInvites.joins[memberInvites.joins.length-1].hasLeft = true;
        await db.set(`users.${member.user.id}.joins`, memberInvites.joins);

        await db.sub(`users.${lastJoined.by}.invites.left`, 1);
        let doneMembers = [member.user.id, lastJoined.by];
        memberInvites.joins.forEach(async (j) => {
            if(!doneMembers.includes(j.by) && await db.has(`users.${j.by}`)) {
                doneMembers.push(j.by);
                await db.sub(`users.${j.by}.invites.left`, 1);
                await db.add(`users.${j.by}.invites.fake`, 1);
            };
        });

        const inviter = client.users.cache.get(lastJoined.by) || await client.users.fetch(lastJoined.by).catch(()=>'');
        const inviterInvites = await db.get(`users.${inviter?.id}`);

        if(!getChannel()) throw new Error(client.translate({
            fr: "Impossible trouver le salon ayant l'id " + config.channelId,
            en: "Could not find channel with id " + config.channelId
        }));
        let message = {
            content: config.message.left.success
                .replace(/{@user}/g, member.user.toString())
                .replace(/{#user}/g, member.user.tag)
                .replace(/{.user}/g, member.user.username)
                .replace(/{@inviter}/g, inviter?.toString() || client.translate({ fr: "inconnu", en: "unknown" }))
                .replace(/{#inviter}/g, inviter?.tag || client.translate({ fr: "inconnu", en: "unknown" }))
                .replace(/{.inviter}/g, inviter?.username || client.translate({ fr: "inconnu", en: "unknown" }))
                .replace(/{inviteCount}/g, inviterInvites ? totalInvitesCounter(inviterInvites) : client.translate({ fr: "inconnu", en: "unknown" }))
                .replace(/{memberCount}/g, member.guild.memberCount)
                .replace(/{inviteCode}/g, lastJoined.inviteCode)
                .replace(/{inviteURL}/g, `https://discord.gg/${lastJoined.inviteCode}`)
        };
        if(config.embed.enabled) {
            const embed = new EmbedBuilder()
                .setColor(Colors[config.embed.colors.left] || Colors.Red)
                .setDescription(message.content)
            message = { embeds: [embed] };
        };
        
        await getChannel().send(message).catch(()=>'');
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
};