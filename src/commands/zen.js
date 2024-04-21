// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

module.exports = {
    name: 'zen',
    description: "play zen",
    category: 'gambling',
    admin: false,
    type: "production",
    cooldown: 1,
    async execute(discord_client, msg, args, admin) {
        try {
            let bet = 10000;
            if (args.length == 0) {
                this.zen_guide(msg, bet);
                return;
            }

            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            if (args.length == 1 && args[0].toLowerCase() == 'stats' && admin) {
                let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);

                let zen_stats = new EmbedBuilder()
                    .setTitle(`Zen Stats`)
                    .setColor('#000000')
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                if (db_user?.times_played_zen && db_user?.times_won_zen && db_user?.net_winnings_zen) {
                    zen_stats.addFields({ name: 'Winrate', value: `Has won ${(db_user.times_won_zen / db_user.times_played_zen * 100).toFixed(2)}% of ${db_user.times_played_zen} zens.`, inline: false });
                    let net_credits = db_user.net_winnings_zen >= 0 ? `You've earned ${comma_adder.add(Math.trunc(db_user.net_winnings_zen))} credits.` : `You've lost ${comma_adder.add(Math.trunc(db_user.net_winnings_zen))} credits.`;
                    zen_stats.addFields({ name: 'Net Credits', value: `${net_credits}`, inline: false });
                }
                else {
                    zen_stats.addFields({ name: 'No Zens', value: 'Play zen to see stats.', inline: false });
                }

                msg.channel.send({ embeds: [zen_stats] });
                return;
            }

            if ((args.length == 1 && !['high', 'seven', 'low'].includes(args[0].toLowerCase())) || args.length > 1) {
                this.zen_guide(msg, bet);
                return;
            }

            if (!(await require('../utility/credits').transaction(discord_client, msg, bet))) return; // credits manager validates transaction

            let dice_1 = Math.floor(Math.random() * 6) + 1; // [1, 6]
            let dice_2 = Math.floor(Math.random() * 6) + 1; // [1, 6]
            let dice_sum = dice_1 + dice_2;

            let multiplier = 0;
            if (args.length == 1 && args[0].toLowerCase() == 'high' && dice_sum > 7) {
                multiplier = 2.4;
            }
            else if (args.length == 1 && args[0].toLowerCase() == 'seven' && dice_sum == 7) {
                multiplier = 6;
            }
            else if (args.length == 1 && args[0].toLowerCase() == 'low' && dice_sum < 7) {
                multiplier = 2.4;
            }

            let winnings = bet * multiplier;
            let outcome = winnings > 0 ? 'Won' : 'Lost';
            let win = winnings > 0 ? 1 : 0;


            let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
            let credits = +db_user.credits;
            let times_played_zen = db_user?.times_played_zen ? +db_user.times_played_zen : 0;
            let times_won_zen = db_user?.times_won_zen ? +db_user.times_won_zen : 0;
            let net_winnings_zen = db_user?.net_winnings_zen ? +db_user.net_winnings_zen : 0;

            credits += winnings;
            times_played_zen += 1;
            times_won_zen += win;
            net_winnings_zen = win == 1 ? net_winnings_zen + winnings - bet : net_winnings_zen - bet;

            await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
                credits: credits.toFixed(2).toString(),
                times_played_zen: times_played_zen.toString(),
                times_won_zen: times_won_zen.toString(),
                net_winnings_zen: net_winnings_zen.toFixed(2).toString(),
            }, { merge: true });


            let zen_embed = new EmbedBuilder()
                .setTitle(`Zen`)
                .setColor('#000000')
                .addFields({ name: `Result: ${outcome}`, value: `Winnings: ${comma_adder.add(Math.trunc(winnings))}`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            let path = '';
            if (dice_sum > 7) {
                path = 'High';
            }
            else if (dice_sum == 7) {
                path = 'Seven';
            }
            else if (dice_sum < 7) {
                path = 'Low';
            }

            zen_embed.addFields({ name: `Path: ${path}`, value: `Rolled (${dice_1}, ${dice_2}): ${dice_sum}`, inline: false })

            msg.channel.send({ embeds: [zen_embed] });
            require('../utility/timers').reset_timer(msg, this.name); // release resource
            return;
        }
        catch (err) {
            // console.log(err);
        }
    },
    async zen_guide(msg, bet) {
        let zen_guide = new EmbedBuilder()
            .setTitle(`Zen Guide`)
            .setDescription(`Bet on the sum of 2 dice. Auto-Bet: ${comma_adder.add(bet)} credits.`)
            .setColor('#000000')
            .addFields({ name: '+zen high', value: `Bet on sum **over 7**. Winnings: ${comma_adder.add(bet * 2.4)}`, inline: false })
            .addFields({ name: '+zen seven', value: `Bet on sum **equal 7**. Winnings: ${comma_adder.add(bet * 6)}`, inline: false })
            .addFields({ name: '+zen low', value: `Bet on sum **below 7**. Winnings: ${comma_adder.add(bet * 2.4)}`, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [zen_guide] });
    }
}