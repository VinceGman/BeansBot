module.exports = {
    name: 'status',
    description: "checks the bot status",
    admin: false,
    type: "final",
    execute(message, args, admin){
        message.channel.send(`**Command Not Set Up** - Description: *${this.description}*`);
    }
}