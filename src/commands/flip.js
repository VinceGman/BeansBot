module.exports = {
    name: 'flip',
    description: "play coin flip",
    category: 'gambling',
    admin: false,
    type: "production",
    cooldown: 2,
    async execute(discord_client, msg, args, admin) {
        try {
            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            let bet = 1000;
            if (args.length == 1 && !isNaN(args[0])) {
                if (+args[0] < 1000) {
                    msg.channel.send(`${msg.author.username} - Your bet must be greater than 1000.`);
                    return;
                }
                if (args[0].includes('.')) {
                    msg.channel.send(`${msg.author.username} - Your number must be whole.`);
                    return;
                }
                bet = +args[0];
            }
            else if (args.length == 1 && args[0].toLowerCase() == 'all') {
                bet = +(await require('../utility/queries').user(msg.author.id)).credits;
            }

            if (!(await require('../utility/credits').transaction(discord_client, msg, bet))) return; // credits manager validates transaction

            let max_num = 20;
            let roll_num = Math.floor(Math.random() * max_num) + 1; // [1, 20]
            let winnings = 0;
            let outcome = 'Lost';

            if (roll_num <= max_num / 2) {
                winnings = bet * 2;
                outcome = winnings > 0 ? 'Won' : 'Lost';
                await require('../utility/credits').refund(discord_client, msg.author.id, winnings);
            }

            const { EmbedBuilder } = require('discord.js');
            let flip_embed = new EmbedBuilder()
                .setTitle(`Coin Flip`)
                .setColor('#000000')
                .addFields({ name: `Result: ${outcome}`, value: `Winnings: ${winnings.toFixed(2)}`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [flip_embed] });
            return;
        }
        catch (err) {
            // console.log(err);
        }
    }
}