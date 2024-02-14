const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

module.exports = {
    name: 'pay',
    description: "pay someone credits",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 2,
    async execute(discord_client, msg, args, admin) {
        if (args.length == 0) {
            this.pay_guide(msg);
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        if (msg.mentions.users.size != 1) {
            this.pay_guide(msg);
            return;
        }

        let recipient = msg.mentions.users.keys().next().value;
        if (recipient == msg.author.id) {
            msg.channel.send(`${msg.author.username} - All you do is take and take... **+pay** for more info.`);
            return;
        }
        if (recipient == discord_client.user.id) {
            msg.channel.send(`${msg.author.username} - This isn't how you pay taxes... **+pay** for more info.`);
            return;
        }

        args = args.filter(a => !a.includes('<@'));

        let random = false;
        if (args.length == 1) {
            let prefixes = ['rand', 'ran', 'r'];
            for (let pf of prefixes) {
                if (args[0].toLowerCase().startsWith(pf)) {
                    args[0] = args[0].slice(pf.length, args[0].length);
                    random = true;
                    break;
                }
            }
        }

        let amount = 0;
        if (args.length == 1 && !isNaN(args[0])) {
            if (+args[0] < 0) {
                msg.channel.send(`${msg.author.username} - Your number must be positive.`);
                return;
            }
            if (args[0].includes('.')) {
                msg.channel.send(`${msg.author.username} - Your number must be whole.`);
                return;
            }
            amount = +args[0];
        }
        else if (args.length == 1 && args[0].toLowerCase() == 'all') {
            amount = +(await require('../utility/queries').user(msg.author.id)).credits;
        }
        else {
            this.pay_guide(msg);
            return;
        }

        amount = random ? Math.floor(Math.random() * amount) + 1 : amount;

        if (!(await require('../utility/credits').transaction(discord_client, msg, amount))) return; // credits manager validates transaction
        await require('../utility/credits').refund(discord_client, recipient, amount); // credits manager refunds credits
        // msg.channel.send(`${msg.author.username} - User paid.`);

        let pay_result = new EmbedBuilder()
            .setTitle(`Payment Details`)
            .setColor('#37914f')
            // .setDescription(`Paid: ${+args[0]}`)
            // .addFields({ name: 'From', value: `${msg.author.username}`, inline: true })
            .addFields({ name: `Recipient`, value: `${(await msg.guild.members.fetch(recipient)).user.username}`, inline: true })
            .addFields({ name: `Amount`, value: `+${comma_adder.add(Math.trunc(amount))} credits`, inline: true })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();
        msg.channel.send({ embeds: [pay_result] });
        return;

    },
    pay_guide(msg) {
        let pay_guide = new EmbedBuilder()
            .setTitle(`Pay Guide`)
            .setDescription(`You can pay someone credits. You must mention the user you'd like to pay anywhere in the message.`)
            .setColor('#000000')
            .addFields({ name: '+pay 1000 @Sore', value: `pays 1000 credits to Sore.`, inline: false })
            .addFields({ name: '+pay @Sore 1000', value: `pays 1000 credits to Sore.`, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [pay_guide] });
    }
}