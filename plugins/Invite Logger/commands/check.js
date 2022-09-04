const { Client, CommandInteraction, SlashCommandSubcommandBuilder, EmbedBuilder, Colors, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    /**
     * @param {Client} client 
     * @returns {SlashCommandSubcommandBuilder}
     */
    render() {
        return new SlashCommandSubcommandBuilder()
            .setName('check')
            .setDescription("Check the invites count")
            .setDescriptionLocalizations({
                fr: "Regardez le compte d'invitations"
            }).addUserOption(option =>
                option.setRequired(false)
                    .setName("user")
                    .setNameLocalizations({
                        fr: "utilisateur"
                    }).setDescription("The user you want to check invites count")
                    .setDescriptionLocalizations({
                        fr: "L'utilisateur dont vous voulez le compte"
                    })
            )
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

        const member = interaction.options?.getMember("user") || interaction.member;

        if(!member || !member.user) return await interaction.editReply({ embeds: [
            client.utils.embeds.error("Le membre séléctionné est introuvable...")
        ] });

        if(!await db.has(`users.${member.user.id}`)) await db.set(`users.${member.user.id}`, {
            id: member.user.id,
            joins: [{
                at: member.joinedAt,
                by: undefined,
                inviteCode: undefined,
                hasLeft: false
            }], bonusHistory: [],
            invites: {
                normal: 0,
                left: 0,
                fake: 0,
                bonus: 0
            }
        });
        const memberInvites = await db.get(`users.${member.user.id}`);
            
        const rank = Object.values(await db.get("users"))
            .sort((a,b) => totalInvitesCounter(b) - totalInvitesCounter(a))
            .map(r => r.id).indexOf(member.user.id) + 1
        const englishRankTermination = rank == 1 ? "st" : rank == 2 ? "nd" : rank == 3 ? "rd" : "th";
        
        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setAuthor({
                name: member.user.tag,
                iconURL: member.user.displayAvatarURL()
            }).setDescription(client.translate({
                fr: (member.user.id == interaction.user.id ? "**Vous** avez " : `${member.user.toString()} a `) + `**${totalInvitesCounter(memberInvites).toLocaleString('fr')}** invitations.\n\n` +
                    `✅ \`${memberInvites.invites.normal}\` Invités\n` +
                    `✨ \`${memberInvites.invites.bonus}\` Bonus\n` +
                    `💩 \`${memberInvites.invites.fake}\` Invalidées\n` +
                    `❌ \`${memberInvites.invites.left}\` Partis\n\n` +
                    `Actuellement **${rank.toLocaleString("fr")}e** sur ${interaction.guild.memberCount} membres.`,
                en: (member.user.id == interaction.user.id ? "**You** have " : `${member.user.toString()} has `) + `**${totalInvitesCounter(memberInvites).toLocaleString()}** invites.\n\n` +
                    `✅ \`${memberInvites.invites.normal}\` Invited\n` +
                    `✨ \`${memberInvites.invites.bonus}\` Bonus\n` +
                    `💩 \`${memberInvites.invites.fake}\` Invalid\n` +
                    `❌ \`${memberInvites.invites.left}\` Left\n\n` +
                    `Currently **${rank.toLocaleString()}${englishRankTermination}** of ${interaction.guild.memberCount} members.`
            }))
        interaction.editReply({ embeds: [embed] }).catch(()=>'');

        function totalInvitesCounter(inviterProfile) {
            return Object.values(inviterProfile.invites).reduce((pre, curr) => pre + curr, 0)
        };
    }
};