// dashboard: https://console.cloud.google.com/firestore/data?project=beans-3260172
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

module.exports = {
    name: 'trip',
    description: "play trip - 3:1 odds w/ 3x pay",
    category: 'gambling',
    admin: false,
    type: "production",
    cooldown: 1,
    async execute(discord_client, msg, args, admin) {
        try {
            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            if (args.length == 1 && args[0].toLowerCase() == 'stats' && admin) {
                let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);

                let trip_stats = new EmbedBuilder()
                    .setTitle(`Trip Stats`)
                    .setColor('#000000')
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                if (db_user?.times_played_trip && db_user?.times_won_trip && db_user?.net_winnings_trip) {
                    trip_stats.addFields({ name: 'Winrate', value: `Has won ${(db_user.times_won_trip / db_user.times_played_trip * 100).toFixed(2)}% of ${db_user.times_played_trip} trips.`, inline: false });
                    let net_credits = db_user.net_winnings_trip >= 0 ? `You've earned ${comma_adder.add(Math.trunc(db_user.net_winnings_trip))} credits.` : `You've lost ${comma_adder.add(Math.trunc(db_user.net_winnings_trip))} credits.`;
                    trip_stats.addFields({ name: 'Net Credits', value: `${net_credits}`, inline: false });
                }
                else {
                    trip_stats.addFields({ name: 'No Trips', value: 'Play trip to see stats.', inline: false });
                }

                msg.channel.send({ embeds: [trip_stats] });
                return;
            }

            let random = false;
            let modifier = 1;
            if (args.length == 1) {
                let prefixes = ['r', 'h', 't', 'f'];
                for (let pf of prefixes) {
                    if (args[0].toLowerCase().startsWith(pf)) {
                        args[0] = args[0].slice(pf.length, args[0].length);
                        if (pf == 'r') random = true;
                        else if (pf == 'h') modifier = 1/2;
                        else if (pf == 't') modifier = 1/3;
                        else if (pf == 'f') modifier = 1/4;
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
                bet = +(await require('../utility/queries').user(msg.guildId, msg.author.id)).credits;
            }

            bet = random ? Math.floor(Math.random() * bet) + 1 : bet;
            bet = Math.floor(bet * modifier);

            if (!(await require('../utility/credits').transaction(discord_client, msg, bet))) return; // credits manager validates transaction

            let max_num = 30;
            let roll_num = Math.floor(Math.random() * max_num) + 1; // [1, 30]
            let winnings = roll_num <= max_num / 3 ? bet * 3 : 0;
            let outcome = winnings > 0 ? 'Won' : 'Lost';
            let win = roll_num <= max_num / 3 ? 1 : 0;


            let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
            let credits = +db_user.credits;
            let times_played_trip = db_user?.times_played_trip ? +db_user.times_played_trip : 0;
            let times_won_trip = db_user?.times_won_trip ? +db_user.times_won_trip : 0;
            let net_winnings_trip = db_user?.net_winnings_trip ? +db_user.net_winnings_trip : 0;

            credits += winnings;
            times_played_trip += 1;
            times_won_trip += win;
            net_winnings_trip = win == 1 ? net_winnings_trip + winnings - bet : net_winnings_trip - bet;

            await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
                credits: credits.toFixed(2).toString(),
                times_played_trip: times_played_trip.toString(),
                times_won_trip: times_won_trip.toString(),
                net_winnings_trip: net_winnings_trip.toFixed(2).toString(),
            }, { merge: true });


            let trip_embed = new EmbedBuilder()
                .setTitle(`Trip`)
                .setColor('#000000')
                .addFields({ name: `Result: ${outcome}`, value: `Winnings: ${comma_adder.add(Math.trunc(winnings))}`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            if (random) trip_embed.addFields({ name: `Random`, value: `Bet: ${comma_adder.add(Math.trunc(bet))}`, inline: false });

            msg.channel.send({ embeds: [trip_embed] });
            require('../utility/timers').reset_timer(msg, this.name); // release resource
            return;
        }
        catch (err) {
            // console.log(err);
        }
    }
}