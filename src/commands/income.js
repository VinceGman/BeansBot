module.exports = {
    name: 'income',
    description: "basic uninversal income",
    admin: false,
    type: "production",
    cooldown: 43200,
    async execute(discord_client, msg, args, admin) {
        await require('../utility/credits').income(msg, this.name, 12000, this.cooldown);
    }
}