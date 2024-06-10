// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

module.exports = {
    name: 'divinity',
    alias: ['div', 'coins', 'coin'],
    alias_show: ['div'],
    description: "make the highest coin streak",
    category: 'gambling',
    admin: false,
    type: "production",
    cooldown: 45,
    async execute(discord_client, msg, args, admin) {
        try {
            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            if (args.length == 1 && args[0].toLowerCase() == 'stats' && admin) {
                let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);

                let divinity_stats = new EmbedBuilder()
                    .setTitle(`Divinity Stats`)
                    .setColor('#000000')
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                if (db_user?.times_played_divinity && db_user?.times_won_divinity && db_user?.net_winnings_divinity) {
                    divinity_stats.addFields({ name: 'Winrate', value: `Has won ${(db_user.times_won_divinity / db_user.times_played_divinity * 100).toFixed(2)}% of ${db_user.times_played_divinity} divinities.`, inline: false });
                    let net_credits = db_user.net_winnings_divinity >= 0 ? `You've earned ${comma_adder.add(Math.trunc(db_user.net_winnings_divinity))} credits.` : `You've lost ${comma_adder.add(Math.trunc(db_user.net_winnings_divinity))} credits.`;
                    divinity_stats.addFields({ name: 'Net Credits', value: `${net_credits}`, inline: false });
                }
                else {
                    divinity_stats.addFields({ name: 'No Divinities', value: 'Play divinity to see stats.', inline: false });
                }

                msg.channel.send({ embeds: [divinity_stats] });
                require('../utility/timers').reset_timer(msg, this.name); // release resource
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

            let coins = 3;
            let actions = 5;
            let turns = 0;

            const filter = m => m.author.id == msg.author.id;
            const collector = msg.channel.createMessageCollector({ filter, time: 20000 });

            let in_play = [];
            this.divinity_show(msg, in_play, bet, random, modifier, coins, actions, turns);
            collector.on('collect', m => {
                let input = m.content.toLowerCase().replace('+', '');
                if (['flip', 'shoot', 'dupe', 'bump', 'bum0', 'quit', 'swap', 'flow', 'bash', 'split', 'consume', 'swipe', 'overclock'].includes(input)) {
                    collector.resetTimer();

                    let valid_action = false;
                    switch (input) {
                        case 'quit':
                            collector.stop();
                            return;
                        case 'flip':
                            if (!coins) {
                                msg.channel.send('You do not have a coin to flip.');
                                break;
                            }
                            coins -= 1;
                            in_play.push(this.entropy());
                            valid_action = true;
                            break;
                        case 'dupe':
                            if (!coins) {
                                msg.channel.send('You do not have a coin to duplicate.');
                                break;
                            }
                            if (actions < 2) {
                                msg.channel.send('You need 2 actions to duplicate.');
                                break;
                            }
                            coins -= 1;
                            actions -= 1;
                            in_play.push(this.entropy());
                            in_play.push(this.entropy());
                            valid_action = true;
                            break;
                        case 'bump':
                        case 'bum0':
                            for (let i = 0; i < in_play.length; i++) {
                                in_play[i] += this.entropy();
                            }
                            valid_action = true;
                            break;
                        case 'swap':
                            if (!coins) {
                                msg.channel.send('You do not have a coin to swap.');
                                break;
                            }
                            coins -= 1;
                            actions += 1;
                            break;
                        case 'flow':
                            if (!coins) {
                                msg.channel.send('You do not have a coin to flow with.');
                                break;
                            }
                            if (in_play.length < 1) {
                                msg.channel.send('You must have 1 coin in play to flow.');
                                break;
                            }
                            if (actions < 2) {
                                msg.channel.send('You need 2 actions to flow.');
                                break;
                            }
                            coins -= 1;
                            actions -= 1;
                            do {
                                in_play.push(this.entropy());
                            } while (in_play.every(c => c % 2 === in_play[0] % 2));
                            valid_action = true;
                            break;
                        case 'bash':
                            if (in_play.length < 2) {
                                msg.channel.send('You must have 2 coins in play to bash.');
                                break;
                            }
                            for (let i = 1; i <= 2; i++) {
                                let randomCoin = Math.floor(Math.random() * in_play.length);
                                in_play.splice(randomCoin, 1);
                            }
                            break;
                        case 'split':
                            if (in_play.length < 2) {
                                msg.channel.send('You must have 2 coins in play to split.');
                                break;
                            }
                            let randomCoins = this.getRandomIndices(in_play.length, in_play.length / 2);
                            for (let i = 0; i < randomCoins.length; i++) {
                                in_play[randomCoins[i]] += 1;
                            }
                            valid_action = true;
                            break;
                        case 'consume':
                        case 'swipe':
                            if (in_play.length < 2) {
                                msg.channel.send('You must have 2 coins in play to swipe.');
                                break;
                            }
                            if (!in_play.every(c => c % 2 === in_play[0] % 2)) {
                                msg.channel.send('All coins must be a streak to swipe.');
                                break;
                            }
                            coins += in_play.length;
                            in_play = [];
                            break;
                        case 'overclock':
                            if (in_play.length < 4) {
                                msg.channel.send('You must have 4 coins in play to overclock.');
                                break;
                            }
                            if (!in_play.every(c => c % 2 === in_play[0] % 2)) {
                                msg.channel.send('All coins must be a streak to overclock.');
                                break;
                            }
                            in_play.splice(0, 4);
                            coins += 3;
                            actions += 4;
                            break;
                        default:
                            msg.channel.send('This action has no binded function.');
                    }

                    if (valid_action) {
                        actions -= 1;
                        turns += 1;
                    }

                    if (actions <= 0) {
                        if (coins <= 0) {
                            collector.stop();
                            return;
                        }
                        coins -= 1;
                        actions += 1;
                    }

                    this.divinity_show(msg, in_play, bet, random, modifier, coins, actions, turns);
                }
            });

            collector.on('end', async (collected) => {
                await this.divinity_end(msg, in_play, bet, random, modifier, coins, actions, turns);
                require('../utility/timers').reset_timer(msg, this.name); // release resource
            });
        }
        catch (err) {
            console.log(err);
        }
    },
    entropy() {
        return Math.random() < 0.5 ? 0 : 1;
    },
    divinity_show(msg, in_play, bet, random, modifier, coins, actions, turns) {
        let content = '';
        for (let coin of in_play) {
            content += `${coin % 2 ? 'H' : 'T'} `;
        }

        content = content ? content : '[No Coins]';

        let multiplier = this.multiplier(turns, coins, actions, in_play);
        multiplier = multiplier > 0 ? multiplier : 0;
        let multiplier_text = ``;
        let color = '#AA5533';
        if (multiplier >= 1.5) {
            color = '#Cc4b53';
            multiplier_text = ` - ${multiplier}x`;
        }
        if (multiplier >= 3) {
            color = '#384E77';
            multiplier_text = ` - ${multiplier}x!`;
        }
        if (multiplier >= 4.5) {
            color = '#FFC759';
            multiplier_text = ` - ${multiplier}x!?`;
        }

        let divinity_embed = new EmbedBuilder()
            .setTitle(`Divinity${multiplier_text}`)
            .setColor(color);

        if (random || modifier != 1) divinity_embed.addFields({ name: random ? `Random` : `Mod`, value: `Bet: ${comma_adder.add(Math.trunc(bet))}`, inline: false });

        divinity_embed
            .addFields({ name: `Resources`, value: `\`\`\`Actions: ${actions}\nCoins: ${coins}\`\`\``, inline: false })
            .addFields({ name: `In Play`, value: `\`\`\`${content}\`\`\``, inline: false })
            // .addFields({ name: `Calc`, value: `\`\`\`${turns}t + ${coins}c + ${actions}a + ${in_play.length}ip - 11 = ${turns + coins + actions + in_play.length - 11}x\`\`\``, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [divinity_embed] });
    },
    async divinity_end(msg, in_play, bet, random, modifier, coins, actions, turns) {

        let content = '';
        for (let coin of in_play) {
            content += `${coin % 2 ? 'H' : 'T'} `;
        }

        content = content ? content : '[No Coins]';

        let multiplier = this.multiplier(turns, coins, actions, in_play);
        multiplier = multiplier > 0 ? multiplier : 0;
        let multiplier_text = '';
        let color = '#AA5533';
        let outcome = 'Lost';
        let winnings = 0;
        if (in_play.length >= 3 && in_play.every(c => c % 2 === in_play[0] % 2)) {
            outcome = 'Won';
            winnings = bet * multiplier;
            multiplier_text = ``;
            if (multiplier >= 1.5) {
                color = '#Cc4b53';
                multiplier_text = ` - ${multiplier}x`;
            }
            if (multiplier >= 3) {
                color = '#384E77';
                multiplier_text = ` - ${multiplier}x!`;
            }
            if (multiplier >= 4.5) {
                color = '#FFC759';
                multiplier_text = ` - ${multiplier}x!?`;
            }
        }

        let divinity_embed = new EmbedBuilder()
            .setTitle(`Divinity${multiplier_text}`)
            .setColor(color)
            .addFields({ name: `Result: ${outcome}`, value: `Winnings: ${comma_adder.add(Math.trunc(winnings))}`, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        if (random || modifier != 1) divinity_embed.addFields({ name: random ? `Random` : `Mod`, value: `Bet: ${comma_adder.add(Math.trunc(bet))}`, inline: false });

        divinity_embed.addFields({ name: `In Play`, value: `\`\`\`${content}\`\`\``, inline: false })
        // .addFields({ name: `Calc`, value: `\`\`\`${turns}t + ${coins}c + ${actions}a + ${in_play.length}ip - 11 = ${turns + coins + actions + in_play.length - 11}x\`\`\``, inline: false })

        await this.finish_game(msg, outcome, winnings, bet);

        msg.channel.send({ embeds: [divinity_embed] });
    },
    async finish_game(msg, win_or_loss, winnings, bet) {
        let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
        let credits = +db_user.credits;
        let times_played_divinity = db_user?.times_played_divinity ? +db_user.times_played_divinity : 0;
        let times_won_divinity = db_user?.times_won_divinity ? +db_user.times_won_divinity : 0;
        let net_winnings_divinity = db_user?.net_winnings_divinity ? +db_user.net_winnings_divinity : 0;

        credits += winnings;
        times_played_divinity += 1;

        let win = win_or_loss == 'Won' ? 1 : 0;
        times_won_divinity += win;

        net_winnings_divinity = win == 1 ? net_winnings_divinity + winnings - bet : net_winnings_divinity - bet;

        await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
            credits: credits.toFixed(2).toString(),
            times_played_divinity: times_played_divinity.toString(),
            times_won_divinity: times_won_divinity.toString(),
            net_winnings_divinity: net_winnings_divinity.toFixed(2).toString(),
        }, { merge: true });
    },
    getRandomIndices(length, numIndices) {
        const indices = [];
        while (indices.length < numIndices) {
            const randomIndex = Math.floor(Math.random() * length);
            if (!indices.includes(randomIndex)) {
                indices.push(randomIndex);
            }
        }
        return indices;
    },
    multiplier(turns, coins, actions, in_play) {
        let stats = turns + coins + actions + in_play.length;
        return (in_play.length > 2 ? ((in_play.length - 2) * 1.5) : 0) + (stats > 8 ? (stats - 8) : 0);
    }
}