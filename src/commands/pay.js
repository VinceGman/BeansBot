module.exports = {
    name: 'pay',
    description: "pay someone credits",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        const { EmbedBuilder } = require('discord.js');

        if (args.length == 0) {
            let pay_guide = new EmbedBuilder()
                .setTitle(`Pay Guide`)
                .setDescription(`You can pay someone credits. You must mention the user you'd like to pay anywhere in the message.`)
                .setColor('#000000')
                .addFields({ name: '+pay 1000 @Sore', value: `pays 1000 credits to Sore.`, inline: false })
                .addFields({ name: '+pay @Sore 1000', value: `pays 1000 credits to Sore.`, inline: false })
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
        if (recipient == discord_client.user.id) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - This isn't how you pay taxes... **+pay** for more info.`);
            return;
        }

        args = args.filter(a => !a.includes('<@'));

        if (args.length == 1 && !isNaN(args[0])) {
            if (+args[0] < 0) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Your number must be positive.`);
                return;
            }
            if (args[0].includes('.')) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Your number must be whole.`);
                return;
            }
            if (!(await require('../utility/credits').transaction(discord_client, msg, +args[0]))) return; // credits manager validates transaction
            await require('../utility/credits').refund(discord_client, recipient, +args[0]); // credits manager refunds credits
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - User paid.`);
            return;
        }
    }
}