module.exports = {
    channelId:                  "",
    message: {
        joined: {
            "success":          "> {@user} has joined ; Invited by **{@inviter}** ; Who has now **{inviteCount}** invites.",
            "unknown":          "> I could not find how {@user} joined the server.",
            "vanity":           "> {@user} joined using the vanity URL.",
            "self-invite":      "> {@user} joined using his own invite. She is not counted."
        }, left: {
            "success":          "> `{#user}` has left the server ; Invited by **{@inviter}** ; Who has now **{inviteCount}** invites.",
            "unknown":          "> `{#user}` has left the server ; I could not find how he joined the server.",
            "vanity":           "> `{#user}` has left the server ; He joined using the vanity URL.",
            "self-invite":      "> `{#user}` has left the server ; He joined using his own invite."
        }
        // POSSIBLE VARIABLES
        //  - {@user}           => The user mention
        //  - {#user}           => The user tag
        //  - {.user}           => The user username
        //  - {@inviter}        => The inviter mention
        //  - {#inviter}        => The inviter tag
        //  - {.inviter}        => The inviter username
        //  - {inviteCode}      => The invite code
        //  - {inviteURL}       => The invite URL
        //  - {inviteCount}     => The invite count of the inviter
        //  - {memberCount}     => The member count of the server
    }, embed: {
        enabled:            true,
        colors: {
            success:        "Green",
            unknown:        "Orange",
            vanity:         "Blue",
            "self-invite":  "Orange",
            left:           "Red"
        }
    }
};