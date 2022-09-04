const { Client, Invite } = require('discord.js');
/**
 * @param {Client} client 
 * @param {Invite} guildInvite
 */
module.exports = async (client, guildInvite) => {
    if(guildInvite.guild.id !== client.config.guildId) return;
    const db = client.db("invite-logger");
    if(!guildInvite.guild || !guildInvite.guild.available || !guildInvite.guild.id) return;

    await db.set(`invites.${guildInvite.code}`, {
        inviterId: guildInvite.inviter?.id,
        code: guildInvite.code,
        uses: guildInvite.uses
    });
};