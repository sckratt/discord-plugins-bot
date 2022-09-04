const { Client, CommandInteraction, SlashCommandSubcommandBuilder, EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    /**
     * @param {Client} client 
     * @returns {SlashCommandSubcommandBuilder}
     */
    render() {
        return new SlashCommandSubcommandBuilder()
            .setName('manage-invites')
            .setDescription("Add or remove a member bonus invites")
            .setDescriptionLocalizations({
                fr: "Ajouter ou retirer des invitations bonus d'un membre"
            }).addUserOption(option =>
                option.setRequired(true)
                    .setName("user")
                    .setNameLocalizations({ fr: "utilisateur" })
                    .setDescription("The member you want to manage the invites")
                    .setDescriptionLocalizations({ fr: "L'utilisateur dont vous voulez gérer les invitations" })
            ).addStringOption(option =>
                option.setRequired(true)
                    .setName('action')
                    .setDescription("Remove or Add invites ?")
                    .setDescriptionLocalizations({ fr: "Ajouter ou retirer des invitations ?" })
                    .setChoices({
                        name: "Add",
                        value: "add",
                        name_localizations: { fr: "Ajouter" }
                    },{
                        name: "Remove",
                        value: "sub",
                        name_localizations: { fr: "Retirer" }
                    })
            ).addNumberOption(option =>
                option.setRequired(true)
                    .setName("amount")
                    .setNameLocalizations({ fr: "montant" })
                    .setDescription("The invites amount you want to add/remove")
                    .setDescriptionLocalizations({ fr: "Le nombre d'invitation que vous voulez ajouter/retirer" })
                    .setMinValue(1)
            ).addStringOption(option =>
                option.setName('reason')
                    .setNameLocalizations({ fr: "raison" })
                    .setDescription("The reason of your action")
                    .setDescriptionLocalizations({ fr: "La raison de votre agissement" })    
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

        const member = interaction.options?.getMember('user');
        const action = interaction.options?.getString('action');
        let amount = interaction.options?.getNumber('amount');
        const reason = interaction.options?.getString('reason', false)

        if(!member || !member.user?.id || member.user?.bot) return await interaction.editReply({ embeds: [
            client.utils.embeds.error(client.translate({
                fr: "Le membre n'a pas été trouvé",
                en: "The member has not been found"
            }))
        ] }); if(!action || !["add", "sub"].includes(action)) return await interaction.editReply({ embeds: [
            client.utils.embeds.error(client.translate({
                fr: "Vous n'avez pas saisi d'action valide (`ajouter` ou `retirer`)",
                en: "You have not selected a valid action (`add` or `remove`)"
            }))
        ] }); if(!amount || isNaN(amount) || amount < 1) return await interaction.editReply({ embeds: [
            client.utils.embeds.error(client.translate({
                fr: "Vous n'avez pas saisi un montant valide d'invitation (`> 1`)",
                en: "You have not provided a valid amount of invites to " + action
            }))
        ] });

        amount = parseInt(amount);
        
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

        try {
            await db[action](`users.${member.user.id}.invites.bonus`, amount);
            await db.push(`users.${member.user.id}.bonusHistory`, {
                by: interaction.user.id,
                at: new Date(),
                amount, action, reason
            });
            await interaction.editReply({ embeds: [
                client.utils.embeds.success(client.translate({
                    fr: `\`${amount}\` invitations ont été ${action == "add" ? "ajoutées" : "retirées"} à ${member.user.toString()}`,
                    en: `\`${amount}\` invites have been ${action == "add" ? "added" : "removed"} from ${member.user.toString()}`
                }))
            ] });
        } catch (err) {
            console.error(err);
            await interaction.editReply({ embeds: [
                client.utils.embeds.error(client.translate({
                    fr: `Une erreur est survenue lors ${action == "add" ? "de l'ajout" : "du retrait"} des invitations de ${member.user.toString()}`,
                    en: `Somthing went wrong for ${action == "add" ? "adding" : "removing"} invites from ${member.user.toString()}`
                }))
            ] })
        };
    }
};