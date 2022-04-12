module.exports = {
    name: 'coinflip',
    description: "50/50 double or nothing",
    admin: false,
    type: "test",
    execute(message, args, admin){
        message.channel.send(`**Command Not Set Up** - Description: *${this.description}*`);
    }
}