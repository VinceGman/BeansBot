// dashboard: https://console.cloud.google.com/firestore/data?project=beans-3260172
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

module.exports = {
    name: 'slip',
    description: "play slip",
    category: 'gambling',
    admin: false,
    type: "production",
    cooldown: 1,
    async execute(discord_client, msg, args, admin) {
        try {
            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            if (args.length == 1 && args[0].toLowerCase() == 'stats' && admin) {
                let db_user = await require('../utility/queries').user(msg.author.id);

                let slip_stats = new EmbedBuilder()
                    .setTitle(`Slip Stats`)
                    .setColor('#000000')
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                if (db_user?.times_played_slip && db_user?.times_won_slip && db_user?.net_winnings_slip) {
                    slip_stats.addFields({ name: 'Winrate', value: `Has won ${(db_user.times_won_slip / db_user.times_played_slip * 100).toFixed(2)}% of ${db_user.times_played_slip} slips.`, inline: false });
                    let net_credits = db_user.net_winnings_slip >= 0 ? `You've earned ${comma_adder.add(Math.trunc(db_user.net_winnings_slip))} credits.` : `You've lost ${comma_adder.add(Math.trunc(db_user.net_winnings_slip))} credits.`;
                    slip_stats.addFields({ name: 'Net Credits', value: `${net_credits}`, inline: false });
                }
                else {
                    slip_stats.addFields({ name: 'No Slips', value: 'Play slip to see stats.', inline: false });
                }

                msg.channel.send({ embeds: [slip_stats] });
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

            let max_num = 100;
            let roll_num = Math.floor(Math.random() * max_num) + 1; // [1, 100]
            let winnings = roll_num <= max_num / 10 ? bet * 10 : 0;
            let outcome = winnings > 0 ? 'Won' : 'Lost';
            let win = roll_num <= max_num / 10 ? 1 : 0;


            let db_user = await require('../utility/queries').user(msg.author.id);
            let credits = +db_user.credits;
            let times_played_slip = db_user?.times_played_slip ? +db_user.times_played_slip : 0;
            let times_won_slip = db_user?.times_won_slip ? +db_user.times_won_slip : 0;
            let net_winnings_slip = db_user?.net_winnings_slip ? +db_user.net_winnings_slip : 0;

            credits += winnings;
            times_played_slip += 1;
            times_won_slip += win;
            net_winnings_slip = win == 1 ? net_winnings_slip + winnings - bet : net_winnings_slip - bet;

            await db.doc(`members/${msg.author.id}`).set({
                credits: credits.toFixed(2).toString(),
                times_played_slip: times_played_slip.toString(),
                times_won_slip: times_won_slip.toString(),
                net_winnings_slip: net_winnings_slip.toFixed(2).toString(),
            }, { merge: true });


            let slip_embed = new EmbedBuilder()
                .setTitle(`Slip`)
                .setColor('#000000')
                .addFields({ name: `Result: ${outcome}`, value: `Winnings: ${comma_adder.add(Math.trunc(winnings))}`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            if (random) slip_embed.addFields({ name: `Random`, value: `Bet: ${comma_adder.add(Math.trunc(bet))}`, inline: false });

            msg.channel.send({ embeds: [slip_embed] });
            return;
        }
        catch (err) {
            // console.log(err);
        }
    }
}