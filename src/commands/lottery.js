
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'lottery',
    alias: ['ticket', 'lot'],
    description: "play the lottery for 10k",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let cost = 10000;
        if (!(await require('../utility/credits').transaction(discord_client, msg, cost))) return; // credits manager validates transaction


        let lottery = (await db.doc(`values/lottery`).get()).data();
        lottery.pot = +lottery.pot;
        lottery.odds = +lottery.odds;

        let roll = Math.floor(Math.random() * lottery.odds) + 1; // [1, 20000]

        let pot, odds;
        if (roll == 1) {
            pot = 350000;
            odds = 200;
        }
        else {
            pot = lottery.odds <= 165 ? lottery.pot + cost : lottery.pot;
            odds = lottery.odds - 1;
        }

        await db.doc(`values/lottery`).set({
            pot: pot.toString(),
            odds: odds.toString(),
        }, { merge: true });

        if (roll == 1) await require('../utility/credits').refund(discord_client, msg.author.id, (lottery.pot + cost) * 0.75); // credits manager refunds on error

        const { MessageEmbed } = require('discord.js');

        let color = roll == 1 ? '#42b0f5' : '#FFFFFF';
        let desc = roll == 1 ? `You've Won!` : 'Roll a 1 to win.';

        let lottery_guide = new MessageEmbed()
            .setTitle(`Lottery`)
            .setDescription(desc)
            .setColor(color)
            .addField('Your roll', `You rolled **${roll}** on 1:${lottery.odds} odds.`, false)
            .addField('Pot', `${lottery.pot}`)
            .addField('+lottery', `pays 10k to play`, false)
            .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
            .setTimestamp();

        msg.channel.send({ embeds: [lottery_guide] });
        return;
    }
}