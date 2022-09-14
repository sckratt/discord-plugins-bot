const { Client, GuildMember, Colors, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
/**
 * @param {Client} client 
 * @param {GuildMember} member
 */
module.exports = async (client, member) => {
    if(member.guild.id !== client.config.guildId) return;
    const db = client.db("captcha");
    const config = require('../config');
    
    if(member.user.bot && config.autokickBots) return await member.kick().catch(()=>'');
    if(member.user.bot && config.botsRoleIds.length) {
        await member.roles.add(
            member.guild.roles.cache.filter(r => config.botsRoleIds.includes(r.id) && !r.managed)
        );
        return;
    };

    try {
        if(config.captchaRoleId) await member.roles.add(config.captchaRoleId);
        
        let msgContent = config.message.joined.content
            .replace(/{@user}/g, member.user.toString())
            .replace(/{#user}/g, member.user.tag)
            .replace(/{.user}/g, member.user.username)
            .replace(/{ID}/g, member.user.id)
            .replace(/{createdAt}/g, `<t:${member.user.createdTimestamp.toString().slice(0, -3)}:R>`)

        let msg = { content: msgContent, embeds: [], components: [] };
        if(config.message.joined.embed.isEmbed) msg = { embeds: [
            new EmbedBuilder()
                .setColor(Colors[config.message.joined.embed.color] || Colors.Green)
                .setDescription(msgContent)
        ], components: [] };
        
        await member.guild.channels.cache.get(config.notifsChannelId).send(msg).catch(()=>'');

        const now = Date.now();
        const endTime = now + 60000;
        const embed = new EmbedBuilder()
            .setColor(Colors.Orange)
            .setAuthor({
                name: member.guild.name,
                iconURL: member.guild.iconURL()
            }).setTitle(client.translate({ fr: "Captcha Anti faux comptes", en: "Captcha Anti fake accounts" }))
            .setDescription(client.translate({
                fr: `⚠ - **Clickez sur le boutton en dessous pour vérifier votre compte !**\n\n` +
                    `⏱ - <t:${endTime.toString().slice(0, -3)}:R> restant`,
                en: `⚠ - **Click on the button below to verify your account !**\n\n` +
                    `⏱ - <t:${endTime.toString().slice(0, -3)}:R> left`
            }))
        const verifyButton = new ButtonBuilder()
            .setCustomId(`captcha.verify.${member.user.id}`)
            .setStyle(ButtonStyle.Success)
            .setLabel(client.translate({
                fr: "Je suis un humain",
                en: "I'm a human"
            }))
        const actionraw = new ActionRowBuilder()
            .addComponents([ verifyButton ])

        try {
            const message = await member.user.send({ embeds: [ embed ], components: [ actionraw ] });
            await message.awaitMessageComponent({
                time: endTime - Date.now(),
                filter: (interaction) => interaction.isButton()
            }).then(async (interaction) => {
                await member.roles.remove(config.captchaRoleId);
                if(config.validUserRoleIds) await member.roles.add(
                    member.guild.roles.cache.filter(r => config.validUserRoleIds.includes(r.id))
                );
                let msgContent = config.message.verified.content
                    .replace(/{@user}/g, member.user.toString())
                    .replace(/{#user}/g, member.user.tag)
                    .replace(/{.user}/g, member.user.username)
                    .replace(/{ID}/g, member.user.id)
                    .replace(/{createdAt}/g, `<t:${member.user.createdTimestamp.toString().slice(0, -3)}:R>`)
                    .replace(/{verificationDuration}/g, Math.floor((Date.now() - now)/1000))

                let msg = { content: msgContent, embeds: [], components: [] };
                if(config.message.verified.embed.isEmbed) msg = { embeds: [
                    new EmbedBuilder()
                        .setColor(Colors[config.message.verified.embed.color] || Colors.Green)
                        .setDescription(msgContent)
                ], components: [] };
                
                await message.delete().catch(()=>'');
                await member.roles.remove(config.captchaRoleId).catch(()=>'');
                await member.guild.channels.cache.get(config.notifsChannelId).send(msg).catch(()=>'');
            }).catch(async () => {
                let msgContent = config.message.kicked.content
                    .replace(/{@user}/g, member.user.toString())
                    .replace(/{#user}/g, member.user.tag)
                    .replace(/{.user}/g, member.user.username)
                    .replace(/{ID}/g, member.user.id)
                    .replace(/{createdAt}/g, `<t:${member.user.createdTimestamp.toString().slice(0, -3)}:R>`)

                let msg = { content: msgContent, embeds: [], components: [] };
                if(config.message.kicked.embed.isEmbed) msg = { embeds: [
                    new EmbedBuilder()
                        .setColor(Colors[config.message.kicked.embed.color] || Colors.Red)
                        .setDescription(msgContent)
                ], components: [] };

                await message.delete().catch(()=>'');
                await member.kick().catch(()=>'');
                await member.guild.channels.cache.get(config.notifsChannelId).send(msg).catch(()=>'');
            });
        } catch {

        };
    } catch (err) {
        console.error(err);
    }
};