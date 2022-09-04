const { Client, InviteTargetType } = require('discord.js');
/**
 * @param {Client} client 
 */
module.exports = async (client) => {
    const db = client.db("invite-logger");
    if(!db.has("invites")) db.set("invites", {});
    if(!db.has("users")) db.set("users", {});

    const guild = client.guilds.cache.get(client.config.guildId);
    if(!guild) throw new Error(client.translate({
        fr: "Impossible de trouver le serveur ayant pour id " + client.config.guildId + ". Vérifiez que le bot est bien dans votre serveur.",
        en: "Cannot find the guild with the id " + client.config.guildId + ". Please check that you have invited the bot."
    }));
    try {
        if(!await db.has(`invites`)) await db.set(`invites`, {});
        const guildInvites = await guild.invites.fetch();
        
        for(let invite of guildInvites.values()) {
            await db.set(`invites.${isVanity(invite) ? "vanity" : invite.code}`, {
                inviterId: invite.inviterId,
                code: isVanity(invite) ? "vanity" : invite.code,
                uses: invite.uses
            });
        };
    
        Object.values(await db.get("invites"))
            .filter(i => !guildInvites.map(i => i.code).includes(i.code))
            .map(i => db.delete(`invites.${i.code}`));
    } catch {
        throw new Error(client.translate({
            fr: "Le bot n'a pas la permissions de voir les invitations. Cette permissions est obligatoire pour son bon fonctionnement.",
            en: "The bot does not have permissions to fetch invites. This permission is mandatory for the good performence."
        }));
    };

    function isVanity(invite) {
        return guild.features.includes("VANITY_URL") && invite.code == guild.vanityURLCode;
    };
};