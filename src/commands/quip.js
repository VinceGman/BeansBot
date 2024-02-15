// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

module.exports = {
    name: 'quip',
    description: "play quip",
    category: 'gambling',
    admin: false,
    type: "production",
    cooldown: 1,
    async execute(discord_client, msg, args, admin) {
        try {
            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            if (args.length == 1 && args[0].toLowerCase() == 'stats' && admin) {
                let db_user = await require('../utility/queries').user(msg.author.id);

                let quip_stats = new EmbedBuilder()
                    .setTitle(`Quip Stats`)
                    .setColor('#000000')
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                if (db_user?.times_played_quip && db_user?.times_won_quip && db_user?.net_winnings_quip) {
                    quip_stats.addFields({ name: 'Winrate', value: `Has won ${(db_user.times_won_quip / db_user.times_played_quip * 100).toFixed(2)}% of ${db_user.times_played_quip} quips.`, inline: false });
                    let net_credits = db_user.net_winnings_quip >= 0 ? `You've earned ${comma_adder.add(Math.trunc(db_user.net_winnings_quip))} credits.` : `You've lost ${comma_adder.add(Math.trunc(db_user.net_winnings_quip))} credits.`;
                    quip_stats.addFields({ name: 'Net Credits', value: `${net_credits}`, inline: false });
                }
                else {
                    quip_stats.addFields({ name: 'No Quips', value: 'Play quip to see stats.', inline: false });
                }

                msg.channel.send({ embeds: [quip_stats] });
                return;
            }

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

            bet = random ? Math.floor(Math.random() * bet) + 1 : bet;

            if (!(await require('../utility/credits').transaction(discord_client, msg, bet))) return; // credits manager validates transaction

            let max_num = 40;
            let roll_num = Math.floor(Math.random() * max_num) + 1; // [1, 40]
            let winnings = roll_num <= max_num / 4 ? bet * 4 : 0;
            let outcome = winnings > 0 ? 'Won' : 'Lost';
            let win = roll_num <= max_num / 4 ? 1 : 0;


            let db_user = await require('../utility/queries').user(msg.author.id);
            let credits = +db_user.credits;
            let times_played_quip = db_user?.times_played_quip ? +db_user.times_played_quip : 0;
            let times_won_quip = db_user?.times_won_quip ? +db_user.times_won_quip : 0;
            let net_winnings_quip = db_user?.net_winnings_quip ? +db_user.net_winnings_quip : 0;

            credits += winnings;
            times_played_quip += 1;
            times_won_quip += win;
            net_winnings_quip = win == 1 ? net_winnings_quip + winnings - bet : net_winnings_quip - bet;

            await db.doc(`members/${msg.author.id}`).set({
                credits: credits.toFixed(2).toString(),
                times_played_quip: times_played_quip.toString(),
                times_won_quip: times_won_quip.toString(),
                net_winnings_quip: net_winnings_quip.toFixed(2).toString(),
            }, { merge: true });


            let quip_embed = new EmbedBuilder()
                .setTitle(`Quip`)
                .setColor('#000000')
                .addFields({ name: `Result: ${outcome}`, value: `Winnings: ${comma_adder.add(Math.trunc(winnings))}`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            if (random) quip_embed.addFields({ name: `Random`, value: `Bet: ${comma_adder.add(Math.trunc(bet))}`, inline: false });

            msg.channel.send({ embeds: [quip_embed] });
            return;
        }
        catch (err) {
            // console.log(err);
        }
    }
}