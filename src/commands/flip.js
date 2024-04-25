// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

module.exports = {
    name: 'flip',
    description: "play flip - 2:1 odds w/ 2x pay",
    category: 'gambling',
    admin: false,
    type: "production",
    cooldown: 1,
    async execute(discord_client, msg, args, admin) {
        try {
            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            if (args.length == 1 && args[0].toLowerCase() == 'stats' && admin) {
                let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);

                let flip_stats = new EmbedBuilder()
                    .setTitle(`Flip Stats`)
                    .setColor('#000000')
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                if (db_user?.times_played_flip && db_user?.times_won_flip && db_user?.net_winnings_flip) {
                    flip_stats.addFields({ name: 'Winrate', value: `Has won ${(db_user.times_won_flip / db_user.times_played_flip * 100).toFixed(2)}% of ${db_user.times_played_flip} flips.`, inline: false });
                    let net_credits = db_user.net_winnings_flip >= 0 ? `You've earned ${comma_adder.add(Math.trunc(db_user.net_winnings_flip))} credits.` : `You've lost ${comma_adder.add(Math.trunc(db_user.net_winnings_flip))} credits.`;
                    flip_stats.addFields({ name: 'Net Credits', value: `${net_credits}`, inline: false });
                }
                else {
                    flip_stats.addFields({ name: 'No Flips', value: 'Play flip to see stats.', inline: false });
                }

                msg.channel.send({ embeds: [flip_stats] });
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

            let max_num = 20;
            let roll_num = Math.floor(Math.random() * max_num) + 1; // [1, 20]
            let winnings = roll_num <= max_num / 2 ? bet * 2 : 0;
            let outcome = winnings > 0 ? 'Won' : 'Lost';
            let win = roll_num <= max_num / 2 ? 1 : 0;


            let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
            let credits = +db_user.credits;
            let times_played_flip = db_user?.times_played_flip ? +db_user.times_played_flip : 0;
            let times_won_flip = db_user?.times_won_flip ? +db_user.times_won_flip : 0;
            let net_winnings_flip = db_user?.net_winnings_flip ? +db_user.net_winnings_flip : 0;

            credits += winnings;
            times_played_flip += 1;
            times_won_flip += win;
            net_winnings_flip = win == 1 ? net_winnings_flip + winnings - bet : net_winnings_flip - bet;

            await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
                credits: credits.toFixed(2).toString(),
                times_played_flip: times_played_flip.toString(),
                times_won_flip: times_won_flip.toString(),
                net_winnings_flip: net_winnings_flip.toFixed(2).toString(),
            }, { merge: true });


            let flip_embed = new EmbedBuilder()
                .setTitle(`Flip`)
                .setColor('#000000')
                .addFields({ name: `Result: ${outcome}`, value: `Winnings: ${comma_adder.add(Math.trunc(winnings))}`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            if (random) flip_embed.addFields({ name: `Random`, value: `Bet: ${comma_adder.add(Math.trunc(bet))}`, inline: false });

            msg.channel.send({ embeds: [flip_embed] });
            require('../utility/timers').reset_timer(msg, this.name); // release resource
            return;
        }
        catch (err) {
            // console.log(err);
        }
    }
}