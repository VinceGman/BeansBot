module.exports = {
    name: 'pay',
    description: "pay credits to someone else",
    admin: false,
    type: "test",
    execute(message, args, admin){
        message.channel.send(`**Command Not Set Up** - Description: *${this.description}*`);
    }
}