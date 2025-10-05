// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

module.exports = {
    name: 'draw',
    description: "pick the highest color",
    category: 'gambling',
    admin: false,
    type: "production",
    cooldown: 15,
    async execute(discord_client, msg, args, admin) {
        try {
            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            if (args.length == 1 && args[0].toLowerCase() == 'stats' && admin) {
                let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);

                let draw_stats = new EmbedBuilder()
                    .setTitle(`Draw Stats`)
                    .setColor('#000000')
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                if (db_user?.times_played_draw && db_user?.times_won_draw && db_user?.net_winnings_draw) {
                    draw_stats.addFields({ name: 'Winrate', value: `Has won ${(db_user.times_won_draw / db_user.times_played_draw * 100).toFixed(2)}% of ${db_user.times_played_draw} draws.`, inline: false });
                    let net_credits = db_user.net_winnings_draw >= 0 ? `You've earned ${comma_adder.add(Math.trunc(db_user.net_winnings_draw))} credits.` : `You've lost ${comma_adder.add(Math.trunc(db_user.net_winnings_draw))} credits.`;
                    draw_stats.addFields({ name: 'Net Credits', value: `${net_credits}`, inline: false });
                }
                else {
                    draw_stats.addFields({ name: 'No Draws', value: 'Play draw to see stats.', inline: false });
                }

                msg.channel.send({ embeds: [draw_stats] });
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
                        else if (pf == 'h') modifier = 1 / 2;
                        else if (pf == 't') modifier = 1 / 3;
                        else if (pf == 'f') modifier = 1 / 4;
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

            let outcomes = this.draw(10);
            let highcards = this.highcardIndexes(outcomes);
            let lowcards = this.lowcardIndexes(outcomes);

            let random_priority = Math.floor(Math.random() * highcards.length);
            let { index, icon, color } = this.input_to_color(highcards[random_priority]);

            let draw_embed = new EmbedBuilder()
                .setTitle(`Draw`)
                .setColor(color)
                .setDescription('Type the color you wish to play!');
            if (random || modifier != 1) draw_embed.addFields({ name: random ? `Random` : `Mod`, value: `Bet: ${comma_adder.add(Math.trunc(bet))}`, inline: false });
            draw_embed.addFields({ name: `Stack`, value: `🟥\`: ${outcomes[0]}${this.indicator(0, highcards, lowcards)}\`\n⬛\`: ${outcomes[1]}${this.indicator(1, highcards, lowcards)}\`\n⬜\`: ${outcomes[2]}${this.indicator(2, highcards, lowcards)}\`\n🟨\`: ${outcomes[3]}${this.indicator(3, highcards, lowcards)}\``, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [draw_embed] });

            let chosen = '';

            const filter = m => m.author.id == msg.author.id;
            const collector = msg.channel.createMessageCollector({ filter, time: 15000 });

            collector.on('end', async (collected) => {
                let { index, icon, color } = this.input_to_color(chosen ? chosen : highcards[random_priority]);

                outcomes = this.draw(10, outcomes);

                let draw_end_embed = new EmbedBuilder()
                    .setTitle(`Draw`)
                    .setColor(color)
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                let win_or_loss = 'Lost';
                let winnings = 0;

                let winners = this.highcardIndexes(outcomes);

                if (winners.includes(index) && winners.length == 1) {
                    win_or_loss = 'Won';
                    winnings = (bet * 2); // + ((outcomes[index] - 7) * (bet / 5)) + ((highcard != index ? 1 : 0) * (bet / 5));
                }

                draw_end_embed.addFields({ name: `Result: ${win_or_loss}`, value: `Winnings: ${comma_adder.add(Math.trunc(winnings))}`, inline: false });
                if (random || modifier != 1) draw_end_embed.addFields({ name: random ? `Random` : `Mod`, value: `Bet: ${comma_adder.add(Math.trunc(bet))}`, inline: false });

                draw_end_embed
                    .setColor(color)
                    .addFields({ name: `Stack`, value: `🟥\`: ${outcomes[0]}${this.clarity(0, winners, index)}\`\n⬛\`: ${outcomes[1]}${this.clarity(1, winners, index)}\`\n⬜\`: ${outcomes[2]}${this.clarity(2, winners, index)}\`\n🟨\`: ${outcomes[3]}${this.clarity(3, winners, index)}\``, inline: false })

                msg.channel.send({ embeds: [draw_end_embed] });

                await this.finish_game(msg, win_or_loss, winnings, bet);

                require('../utility/timers').reset_timer(msg, this.name); // release resource
            });

            collector.on('collect', m => {
                let input = m.content.toLowerCase().replace('+', '');
                if (['red', 'black', 'white', 'yellow', 'r', 'b', 'w', 'y'].includes(input)) {
                    chosen = input;
                    collector.stop();
                }
            });
        }
        catch (err) {
            console.log(err);
        }
    },
    draw(n, outcomes = [0, 0, 0, 0]) {
        for (let i = 1; i <= n; i++) {
            let index = Math.floor(Math.random() * 4);
            outcomes[index] += 1;
        }
        return outcomes;
    },
    highcardIndexes(outcomes) {
        const max = Math.max(...outcomes);
        const highcards = outcomes.reduce((acc, currentValue, index) => {
            if (currentValue === max) {
                acc.push(index);
            }
            return acc;
        }, []);
        return highcards;
    },
    lowcardIndexes(outcomes) {
        const min = Math.min(...outcomes);
        const lowcards = outcomes.reduce((acc, currentValue, index) => {
            if (currentValue === min) {
                acc.push(index);
            }
            return acc;
        }, []);
        return lowcards;
    },
    indicator(index, highcards, lowcards) {
        let indicator = '';
        if (highcards.includes(index)) indicator += '';
        else if (lowcards.includes(index)) indicator += '';
        else indicator += '';
        return indicator;
    },
    clarity(current, highcards, index) {
        let indicator = '';
        if (highcards.includes(current)) {
            if (highcards.length == 1) {
                indicator += ' 👑';
            }
            else {
                indicator += ' ❌';
            }
        }
        return indicator;
    },
    input_to_color(input) {
        switch (input) {
            case 'red':
            case 'r':
            case 0:
                return {
                    index: 0,
                    icon: '🟥',
                    color: '#dd2e44',
                }
            case 'black':
            case 'b':
            case 1:
                return {
                    index: 1,
                    icon: '⬛',
                    color: '#31373d',
                }
            case 'white':
            case 'w':
            case 2:
                return {
                    index: 2,
                    icon: '⬜',
                    color: '#e6e7e8',
                }
            case 'yellow':
            case 'y':
            case 3:
                return {
                    index: 3,
                    icon: '🟨',
                    color: '#fdcb58',
                }
        }
    },
    async finish_game(msg, win_or_loss, winnings, bet) {
        let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
        let credits = +db_user.credits;
        let times_played_draw = db_user?.times_played_draw ? +db_user.times_played_draw : 0;
        let times_won_draw = db_user?.times_won_draw ? +db_user.times_won_draw : 0;
        let net_winnings_draw = db_user?.net_winnings_draw ? +db_user.net_winnings_draw : 0;

        credits += winnings;
        times_played_draw += 1;

        let win = win_or_loss == 'Won' ? 1 : 0;
        times_won_draw += win;

        net_winnings_draw = win == 1 ? net_winnings_draw + winnings - bet : net_winnings_draw - bet;

        await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
            credits: credits.toFixed(2).toString(),
            times_played_draw: times_played_draw.toString(),
            times_won_draw: times_won_draw.toString(),
            net_winnings_draw: net_winnings_draw.toFixed(2).toString(),
        }, { merge: true });
    }
}