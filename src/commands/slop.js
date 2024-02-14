// dashboard: https://console.cloud.google.com/firestore/data?project=beans-3260172
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

module.exports = {
    name: 'slop',
    description: "play slop",
    category: 'gambling',
    admin: false,
    type: "test",
    cooldown: 1,
    async execute(discord_client, msg, args, admin) {
        try {
            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            if (args.length == 1 && args[0].toLowerCase() == 'stats' && admin) {
                let db_user = await require('../utility/queries').user(msg.author.id);

                let slop_stats = new EmbedBuilder()
                    .setTitle(`Slop Stats`)
                    .setColor('#000000')
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                if (db_user?.times_played_slop && db_user?.times_won_slop && db_user?.net_winnings_slop) {
                    slop_stats.addFields({ name: 'Winrate', value: `Has won ${(db_user.times_won_slop / db_user.times_played_slop * 100).toFixed(2)}% of ${db_user.times_played_slop} slops.`, inline: false });
                    let net_credits = db_user.net_winnings_slop >= 0 ? `You've earned ${comma_adder.add(Math.trunc(db_user.net_winnings_slop))} credits.` : `You've lost ${comma_adder.add(Math.trunc(db_user.net_winnings_slop))} credits.`;
                    slop_stats.addFields({ name: 'Net Credits', value: `${net_credits}`, inline: false });
                }
                else {
                    slop_stats.addFields({ name: 'No Slops', value: 'Play slop to see stats.', inline: false });
                }

                msg.channel.send({ embeds: [slop_stats] });
                return;
            }

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

            let max_num = 100;
            let roll_num = Math.floor(Math.random() * max_num) + 1; // [1, 100]
            let winnings = roll_num <= max_num / 10 ? bet * 10 : 0;
            let outcome = winnings > 0 ? 'Won' : 'Lost';
            let win = roll_num <= max_num / 10 ? 1 : 0;

            if (bet >= 1000) {
                let db_user = await require('../utility/queries').user(msg.author.id);
                let credits = +db_user.credits;
                let times_played_slop = db_user?.times_played_slop ? +db_user.times_played_slop : 0;
                let times_won_slop = db_user?.times_won_slop ? +db_user.times_won_slop : 0;
                let net_winnings_slop = db_user?.net_winnings_slop ? +db_user.net_winnings_slop : 0;

                credits += winnings;
                times_played_slop += 1;
                times_won_slop += win;
                net_winnings_slop = win == 1 ? net_winnings_slop + winnings - bet : net_winnings_slop - bet;

                await db.doc(`members/${msg.author.id}`).set({
                    credits: credits.toFixed(2).toString(),
                    times_played_slop: times_played_slop.toString(),
                    times_won_slop: times_won_slop.toString(),
                    net_winnings_slop: net_winnings_slop.toFixed(2).toString(),
                }, { merge: true });
            }

            let slop_embed = new EmbedBuilder()
                .setTitle(`Slop`)
                .setColor('#000000')
                .addFields({ name: `Result: ${outcome}`, value: `Winnings: ${comma_adder.add(Math.trunc(winnings))}`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [slop_embed] });
            return;
        }
        catch (err) {
            // console.log(err);
        }
    }
}