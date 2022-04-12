module.exports = {
    name: 'restore',
    description: "gives money to one specific user",
    admin: true,
    type: "test",
    execute(message, args, admin){
        message.channel.send(`**Command Not Set Up** - Description: *${this.description}*`);
    }
}