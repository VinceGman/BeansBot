module.exports = {
    name: 'stimulus',
    description: "gives money to everyone",
    admin: true,
    type: "test",
    execute(message, args, admin){
        message.channel.send(`**Command Not Set Up** - Description: *${this.description}*`);
    }
}