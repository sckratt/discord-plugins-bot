module.exports = {
    captchaRoleId: "",
    autokickBots: true,
    botsRoleIds: [],
    validUserRoleIds: [],
    notifsChannelId: "",
    message: {
        joined: {
            content: "{@user} joined ; He is actually in verification ; He was created {createdAt}",
            /* 
                {@user}     - The user mention
                {#user}     - The user tag
                {.user}     - the user username
                {ID}        - The user id
                {createdAt} - The user account creation timestamp
            */
            embed: {
                isEmbed: true,
                color: "Blue"
            }
        },
        verified: {
            content: "{@user} has been verified ; Verification durated **{verificationDuration}** seconds",
            /* 
                {@user}                 - The user mention
                {#user}                 - The user tag
                {.user}                 - the user username
                {ID}                    - The user id
                {createdAt}             - The user account creation timestamp
                {verificationDuration}  - The duration of the verifiation (seconds)
            */
            embed: {
                isEmbed: true,
                color: "Green"
            }
        },
        kicked: {
            content: "`{#user}` has been kicked ; He has not completed the verification step",
            /* 
                {@user}     - The user mention
                {#user}     - The user tag
                {.user}     - the user username
                {ID}        - The user id
                {createdAt} - The user account creation timestamp
            */
            embed: {
                isEmbed: true,
                color: "Red"
            }
        }
    }
}