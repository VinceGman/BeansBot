// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

module.exports = {
    name: 'rip',
    description: "play rip - 2:1 w/ 2x, 3:1 w/ 3x, or 4:1 w/ 4x",
    category: 'gambling',
    admin: false,
    type: "production",
    cooldown: 1,
    async execute(discord_client, msg, args, admin) {
        try {
            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            if (args.length == 1 && args[0].toLowerCase() == 'stats' && admin) {
                let db_user = await require('../utility/queries').user(msg.author.id);

                let rip_stats = new EmbedBuilder()
                    .setTitle(`Rip Stats`)
                    .setColor('#000000')
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                if (db_user?.times_played_rip && db_user?.times_won_rip && db_user?.net_winnings_rip) {
                    rip_stats.addFields({ name: 'Winrate', value: `Has won ${(db_user.times_won_rip / db_user.times_played_rip * 100).toFixed(2)}% of ${db_user.times_played_rip} rips.`, inline: false });
                    let net_credits = db_user.net_winnings_rip >= 0 ? `You've earned ${comma_adder.add(Math.trunc(db_user.net_winnings_rip))} credits.` : `You've lost ${comma_adder.add(Math.trunc(db_user.net_winnings_rip))} credits.`;
                    rip_stats.addFields({ name: 'Net Credits', value: `${net_credits}`, inline: false });
                }
                else {
                    rip_stats.addFields({ name: 'No Rips', value: 'Play rip to see stats.', inline: false });
                }

                msg.channel.send({ embeds: [rip_stats] });
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

            let bet_odds = Math.floor(Math.random() * 3) + 2;

            let max_num = bet_odds * 10;
            let roll_num = Math.floor(Math.random() * max_num) + 1; // [1, betodds * 10]
            let winnings = roll_num <= max_num / bet_odds ? bet * bet_odds : 0;
            let outcome = winnings > 0 ? 'Won' : 'Lost';
            let win = roll_num <= max_num / bet_odds ? 1 : 0;


            let db_user = await require('../utility/queries').user(msg.author.id);
            let credits = +db_user.credits;
            let times_played_rip = db_user?.times_played_rip ? +db_user.times_played_rip : 0;
            let times_won_rip = db_user?.times_won_rip ? +db_user.times_won_rip : 0;
            let net_winnings_rip = db_user?.net_winnings_rip ? +db_user.net_winnings_rip : 0;

            credits += winnings;
            times_played_rip += 1;
            times_won_rip += win;
            net_winnings_rip = win == 1 ? net_winnings_rip + winnings - bet : net_winnings_rip - bet;

            await db.doc(`members/${msg.author.id}`).set({
                credits: credits.toFixed(2).toString(),
                times_played_rip: times_played_rip.toString(),
                times_won_rip: times_won_rip.toString(),
                net_winnings_rip: net_winnings_rip.toFixed(2).toString(),
            }, { merge: true });


            let rip_embed = new EmbedBuilder()
                .setTitle(`Rip : d${bet_odds}`)
                .setColor('#000000')
                .addFields({ name: `Result: ${outcome}`, value: `Winnings: ${comma_adder.add(Math.trunc(winnings))}`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            if (random) rip_embed.addFields({ name: `Random`, value: `Bet: ${comma_adder.add(Math.trunc(bet))}`, inline: false });

            msg.channel.send({ embeds: [rip_embed] });
            require('../utility/timers').reset_timer(msg, this.name); // release resource
            return;
        }
        catch (err) {
            // console.log(err);
        }
    }
}