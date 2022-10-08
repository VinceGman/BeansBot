module.exports = {
    name: 'pay',
    description: "pay someone credits",
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let pay_guide = new MessageEmbed()
                .setTitle(`Pay Guide`)
                .setDescription(`You can pay someone credits. You must mention the user you'd like to pay anywhere in the message.`)
                .setColor('#000000')
                .addField('+pay 1000 @Sore', `pays 1000 credits to Sore.`, false)
                .addField('+pay @Sore 1000', `pays 1000 credits to Sore.`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [pay_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        if (msg.mentions.users.size != 1) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - **+pay** for more info.`);
            return;
        }

        let recipient = msg.mentions.users.keys().next().value;
        if (recipient == msg.author.id) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - All you do is take and take... **+pay** for more info.`);
            return;
        }

        args = args.filter(a => !a.includes('<@'));

        if (args.length == 1 && !isNaN(args[0])) {
            if (!(await require('../utility/credits').transaction(msg, +args[0]))) return; // credits manager validates transaction
            await require('../utility/credits').refund(recipient, +args[0]); // credits manager refunds credits
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - User paid.`);
            return;
        }
    }
}