
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'deathroll',
    alias: ['dr'],
    description: "deathroll for money",
    category: 'gambling',
    admin: false,
    type: "test",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {

        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let deathroll_guide = new MessageEmbed()
                .setTitle(`Deathroll Guide`)
                .setDescription(`Deathroll 1v1`)
                .setColor('#000000')
                .addField('+deathroll @Sore', `Starts a deathroll game with Sore with an auto 10k bet.`, false)
                .addField('+deathroll @Sore 20000', `Starts a deathroll game with Sore with a 20k bet.`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [deathroll_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let cost = 10000;

        if (msg.mentions.users.size != 1) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - **+deathroll** for more info.`);
            return;
        }

        let recipient = msg.mentions.users.keys().next().value;
        if (recipient == msg.author.id) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Can't challenge yourself... **+deathroll** for more info.`);
            return;
        }
        if (recipient == discord_client.user.id) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Can't challenge Beans... **+deathroll** for more info.`);
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

            cost = +args[0];
        }


        let receiver = await msg.guild.members.fetch(recipient);
        msg.channel.send(`${receiver.user.username} type **roll** to play`);

        if (!(await require('../utility/credits').transaction(discord_client, msg, cost))) return; // credits manager validates transaction


        let odds = 1000;
        let winner;
        let current_turn = recipient;
        let recipient_payment = false;

        const filter = m => m.author.id == msg.author.id || m.author.id == recipient;
        const collector = msg.channel.createMessageCollector({ filter, time: 30000 });

        collector.on('end', async collected => {
            if (odds == 1) {
                winner = current_turn;
            }
            else {
                winner = current_turn == recipient ? msg.author.id : recipient;
            }

            require('../utility/credits').refund(discord_client, winner, cost * 2); // credits manager refunds on error
            let user = await msg.guild.members.fetch(winner);
            msg.channel.send(`Winner: ${user.user.username} - Payout: ${cost}`);
        });

        collector.on('collect', async m => {
            if (m.content.toLowerCase() == 'roll' && m.author.id == current_turn) {
                current_turn = current_turn == recipient ? msg.author.id : recipient;

                if (m.author.id == recipient && !recipient_payment) {
                    if (!(await require('../utility/credits').transaction(discord_client, m, cost))) {
                        current_turn = current_turn == recipient ? msg.author.id : recipient;
                        collector.stop();
                        return;
                    }
                    else {
                        recipient_payment = true;
                    }
                }

                collector.resetTimer();

                roll_odds = odds;
                odds = Math.floor(Math.random() * odds) + 1; // [1, odds]

                msg.channel.send(`${m.author.username} - rolled \`d${roll_odds}\`: **${odds}**`);

                if (odds == 1) {
                    collector.stop();
                }
            }
        });



        // let pot, odds;
        // if (roll == 1) {
        //     pot = 0;
        //     odds = 1000;
        // }
        // else {
        //     pot = deathroll.pot + cost;
        //     odds = roll;
        // }


        // if (roll == 1) await require('../utility/credits').refund(discord_client, msg.author.id, deathroll.pot + cost); // credits manager refunds on error

        // const { MessageEmbed } = require('discord.js');

        // let color = roll == 1 ? '#42b0f5' : '#FFFFFF';
        // let desc = roll == 1 ? `You've Won!` : 'Roll a 1 to win.';

        // let deathroll_guide = new MessageEmbed()
        //     .setTitle(`Deathroll`)
        //     .setDescription(desc)
        //     .setColor(color)
        //     .addField('Your roll', `You rolled **${roll}** on 1:${deathroll.odds} odds.`, false)
        //     .addField('Pot', `${deathroll.pot + cost}`)
        //     .addField('+deathroll', `deathrolls 3k to play`, false)
        //     .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
        //     .setTimestamp();

        // msg.channel.send({ embeds: [deathroll_guide] });
        // return;
    }
}