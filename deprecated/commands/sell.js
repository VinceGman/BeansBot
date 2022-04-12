module.exports = {
    name: 'sell',
    description: "sell an item",
    admin: false,
    type: "test",
    execute(message, args, admin){
        message.channel.send(`**Command Not Set Up** - Description: *${this.description}*`);
    }
}