
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
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {

        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let deathroll_guide = new MessageEmbed()
                .setTitle(`Deathroll Guide & Dashboard`)
                .setDescription(`Deathroll 1v1`)
                .setColor('#000000')
                .addField('+deathroll @Sore', `Starts a deathroll game with Sore with an auto 10k bet.`, false)
                .addField('+deathroll @Sore 20000', `Starts a deathroll game with Sore with a 20k bet.`, false)
                .addField('\u200B', '\u200B', false)
                .addField('Dashboard', `Here's all your deathroll data.`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            let user = await require('../utility/queries').user(msg.author.id);
            if (user?.deathroll_stats) {

                let wins = 0;
                let games = 0;
                let top_death = 0;
                for (let stats in user.deathroll_stats) {
                    wins += +user.deathroll_stats[stats].wins;
                    games += +user.deathroll_stats[stats].wins + +user.deathroll_stats[stats].losses;
                    top_death = top_death < +user.deathroll_stats[stats].top_death ? +user.deathroll_stats[stats].top_death : top_death;
                }

                deathroll_guide.addField('Winrate', `Has won ${(wins/games*100).toFixed(2)}% of ${games} games.`, false);
                deathroll_guide.addField('Top Death', `You've died from ${top_death} odds.`, false);
            }
            else {
                deathroll_guide.addField('No Games', 'Play games to see stats.');
            }

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

        let turns = { [`${msg.author.id}_turns`]: 0, [`${recipient}_turns`]: 0, [`${msg.author.id}_skips`]: [], [`${recipient}_skips`]: [] };

        const filter = m => m.author.id == msg.author.id || m.author.id == recipient;
        const collector = msg.channel.createMessageCollector({ filter, time: 30000 });

        collector.on('end', async collected => {
            if (odds == 1) {
                winner = current_turn;
            }
            else {
                winner = current_turn == recipient ? msg.author.id : recipient;
            }

            let loser = winner == recipient ? msg.author.id : recipient;
            let multiple = 1;

            if (recipient_payment) {
                await this.set_stats(msg.author.id, recipient, msg.author.id, winner, turns, cost);
                await this.set_stats(recipient, msg.author.id, msg.author.id, winner, turns, cost);

                multiple = 2;
            }

            require('../utility/credits').refund(discord_client, winner, cost * multiple); // credits manager refunds on error
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

                turns[`${m.author.id}_turns`] += 1;
                turns[`${m.author.id}_skips`].push(roll_odds - odds);

                msg.channel.send(`${m.author.username} - rolled \`d${roll_odds}\`: **${odds}**`);

                if (odds == 1) {
                    collector.stop();
                }
            }
        });
    },
    async set_stats(target, opponent, challenger, winner, turns, cost) {
        let target_db = await require('../utility/queries').user(target);
        let deathroll_stats = target_db?.deathroll_stats ? target_db.deathroll_stats : {};
        if (!deathroll_stats?.[opponent]) deathroll_stats[opponent] = {
            wins: 0,
            losses: 0,
            credit_net: 0,
            turns: 0,
            skips: 0,
            top_skip: 0,
            top_death: 0,
            challenge_out: 0,
            challenge_in: 0,
            low_turn_kill: 0,
            high_turn_kill: 0,
            low_turn_death: 0,
            high_turn_death: 0,
        }
        else {
            for (const property in deathroll_stats[opponent]) {
                deathroll_stats[opponent][property] = +deathroll_stats[opponent][property];
            }
        }

        if (target == winner) {
            deathroll_stats[opponent].wins += 1;
            deathroll_stats[opponent].credit_net += cost;
            if (deathroll_stats[opponent].low_turn_kill == 0) {
                deathroll_stats[opponent].low_turn_kill = turns[`${target}_turns`];
            }
            else {
                deathroll_stats[opponent].low_turn_kill = deathroll_stats[opponent].low_turn_kill > turns[`${target}_turns`] ? turns[`${target}_turns`] : deathroll_stats[opponent].low_turn_kill;
            }
            deathroll_stats[opponent].high_turn_kill = deathroll_stats[opponent].high_turn_kill < turns[`${target}_turns`] ? turns[`${target}_turns`] : deathroll_stats[opponent].high_turn_kill;
        }
        else {
            deathroll_stats[opponent].losses += 1;
            deathroll_stats[opponent].credit_net -= cost;
            deathroll_stats[opponent].top_death = deathroll_stats[opponent].top_death < (turns[`${target}_skips`][turns[`${target}_skips`].length - 1] + 1) ? (turns[`${target}_skips`][turns[`${target}_skips`].length - 1] + 1) : deathroll_stats[opponent].top_death;

            if (deathroll_stats[opponent].low_turn_death == 0) {
                deathroll_stats[opponent].low_turn_death = turns[`${target}_turns`];
            }
            else {
                deathroll_stats[opponent].low_turn_death = deathroll_stats[opponent].low_turn_death > turns[`${target}_turns`] ? turns[`${target}_turns`] : deathroll_stats[opponent].low_turn_death;
            }
            deathroll_stats[opponent].high_turn_death = deathroll_stats[opponent].high_turn_death < turns[`${target}_turns`] ? turns[`${target}_turns`] : deathroll_stats[opponent].high_turn_death;
        }
        if (target == challenger) {
            deathroll_stats[opponent].challenge_out += 1;
        }
        else {
            deathroll_stats[opponent].challenge_in += 1;
        }

        deathroll_stats[opponent].turns += turns[`${target}_turns`];
        deathroll_stats[opponent].skips += turns[`${target}_skips`].reduce((sum, a) => sum + a, 0);

        deathroll_stats[opponent].top_skip = deathroll_stats[opponent].top_skip < Math.max(...turns[`${target}_skips`]) ? Math.max(...turns[`${target}_skips`]) : deathroll_stats[opponent].top_skip;

        for (const property in deathroll_stats[opponent]) {
            deathroll_stats[opponent][property] = `${deathroll_stats[opponent][property]}`;
        }

        await db.doc(`members/${target}`).update({
            deathroll_stats: deathroll_stats,
        });
    }
}

                // highest turn skip        (+)     check if one of the skips was bigger than the current, replace
                // average skip per turn    (-)     skips count / turns count
                // be challenged count      (+)     increment when challenger
                // give challenged count    (+)     increment when challenged
                // lowest turn kill         (+)     check if the turns of the game are lower than the one in the system
                // highest turn kill        (+)     check if the turns of the game are higher than the one in the system
                // lowest turn death        (+)     check if the turns of the game are lower than the one in the system
                // highest turn death       (+)     check if the turns of the game are higher than the one in the system
                // average turns            (-)     turns count / (wins + losses)
                // turns count              (+)
                // skips count              (+)