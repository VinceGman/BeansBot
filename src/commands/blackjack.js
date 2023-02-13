
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

class Blackjack {
    constructor() {
        this.deck = this.get_deck();

        this.player_cards = [];
        this.dealer_cards = [];
        this.dealer_hidden = [];

        this.player_score = 0;
        this.dealer_score = 0;

        this.state = { ended: false };
    }

    start() {
        this.player_cards = this.deal_card(this.player_cards);
        this.dealer_cards = this.deal_card(this.dealer_cards);
        this.player_cards = this.deal_card(this.player_cards);
        this.dealer_hidden = this.deal_card(this.dealer_hidden);

        this.player_score = this.calculate_score(this.player_cards);
        this.dealer_score = this.calculate_score(this.dealer_cards);

        this.check_state();
    }

    hit() {
        this.player_cards = this.deal_card(this.player_cards);
        this.player_score = this.calculate_score(this.player_cards);
        this.check_state();
    }

    stand() {
        this.end_state();
    }

    check_state() {
        if (this.player_score >= 21) this.end_state();
    }

    end_state() {
        if (this.player_score > 21) {
            this.state = { ended: true, player_multiplier: 0 };
        }
        else if (this.player_score == 21) {
            this.run_dealer();
            if (this.dealer_score == 21) {
                this.state = { ended: true, player_multiplier: 1 };
            }
            else {
                this.state = { ended: true, player_multiplier: 2.5 };
            }
        }
        else if (this.player_score < 21) {
            this.run_dealer();
            if (this.dealer_score < this.player_score) {
                this.state = { ended: true, player_multiplier: 2 };
            }
            else if (this.dealer_score > this.player_score) {
                if (this.dealer_score <= 21) {
                    this.state = { ended: true, player_multiplier: 0 };
                }
                else {
                    this.state = { ended: true, player_multiplier: 2 };
                }
            }
            else if (this.dealer_score == this.player_score) {
                this.state = { ended: true, player_multiplier: 1 };
            }
        }
    }

    run_dealer() {
        this.dealer_cards.push(this.dealer_hidden.shift());
        this.dealer_score = this.calculate_score(this.dealer_cards);

        while (this.dealer_score <= 16 || (this.dealer_score == 17 && this.dealer_cards.reduce((aces, card) => (card.rank == 'A' ? aces + 1 : aces), 0) > 0)) {
            this.dealer_cards = this.deal_card(this.dealer_cards);
            this.dealer_score = this.calculate_score(this.dealer_cards);
        }
    }

    deal_card(cards) {
        cards.push(this.deck.shift());
        return cards;
    }

    calculate_score(cards) {
        let total = cards.reduce((score, card) => card.value + score, 0);
        for (let card of cards) {
            if (card.rank == 'A' && total + 10 <= 21) {
                total += 10;
            }
        }
        return total;
    }

    print_game() {
        return {
            state: this.state,
            player_cards: this.player_cards,
            dealer_cards: this.dealer_cards,
            player_score: this.player_score,
            dealer_score: this.dealer_score,
        }
    }

    get_deck() {
        let club = '♧';
        let diamond = '♢';
        let heart = '♡';
        let spade = '♤';

        const deck = [
            { suit: club, rank: 'A', value: 1 },
            { suit: club, rank: '2', value: 2 },
            { suit: club, rank: '3', value: 3 },
            { suit: club, rank: '4', value: 4 },
            { suit: club, rank: '5', value: 5 },
            { suit: club, rank: '6', value: 6 },
            { suit: club, rank: '7', value: 7 },
            { suit: club, rank: '8', value: 8 },
            { suit: club, rank: '9', value: 9 },
            { suit: club, rank: '10', value: 10 },
            { suit: club, rank: 'J', value: 10 },
            { suit: club, rank: 'Q', value: 10 },
            { suit: club, rank: 'K', value: 10 },

            { suit: diamond, rank: 'A', value: 1 },
            { suit: diamond, rank: '2', value: 2 },
            { suit: diamond, rank: '3', value: 3 },
            { suit: diamond, rank: '4', value: 4 },
            { suit: diamond, rank: '5', value: 5 },
            { suit: diamond, rank: '6', value: 6 },
            { suit: diamond, rank: '7', value: 7 },
            { suit: diamond, rank: '8', value: 8 },
            { suit: diamond, rank: '9', value: 9 },
            { suit: diamond, rank: '10', value: 10 },
            { suit: diamond, rank: 'J', value: 10 },
            { suit: diamond, rank: 'Q', value: 10 },
            { suit: diamond, rank: 'K', value: 10 },

            { suit: heart, rank: 'A', value: 1 },
            { suit: heart, rank: '2', value: 2 },
            { suit: heart, rank: '3', value: 3 },
            { suit: heart, rank: '4', value: 4 },
            { suit: heart, rank: '5', value: 5 },
            { suit: heart, rank: '6', value: 6 },
            { suit: heart, rank: '7', value: 7 },
            { suit: heart, rank: '8', value: 8 },
            { suit: heart, rank: '9', value: 9 },
            { suit: heart, rank: '10', value: 10 },
            { suit: heart, rank: 'J', value: 10 },
            { suit: heart, rank: 'Q', value: 10 },
            { suit: heart, rank: 'K', value: 10 },

            { suit: spade, rank: 'A', value: 1 },
            { suit: spade, rank: '2', value: 2 },
            { suit: spade, rank: '3', value: 3 },
            { suit: spade, rank: '4', value: 4 },
            { suit: spade, rank: '5', value: 5 },
            { suit: spade, rank: '6', value: 6 },
            { suit: spade, rank: '7', value: 7 },
            { suit: spade, rank: '8', value: 8 },
            { suit: spade, rank: '9', value: 9 },
            { suit: spade, rank: '10', value: 10 },
            { suit: spade, rank: 'J', value: 10 },
            { suit: spade, rank: 'Q', value: 10 },
            { suit: spade, rank: 'K', value: 10 }
        ];

        return require('lodash').shuffle(deck);
    }
}

module.exports = {
    name: 'blackjack',
    alias: ['bj'],
    description: "play blackjack",
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let bet = 1000;
        if (args.length == 1 && !isNaN(args[0])) {
            if (+args[0] < 1000) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Your bet must be greater than 1000.`);
                return;
            }
            if (args[0].includes('.')) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Your number must be whole.`);
                return;
            }
            bet = +args[0];
        }

        if (!(await require('../utility/credits').transaction(discord_client, msg, bet))) return; // credits manager validates transaction

        const game = new Blackjack();
        game.start();

        const filter = m => m.author.id == msg.author.id;
        const collector = msg.channel.createMessageCollector({ filter, time: 15000 });

        collector.on('end', collected => {
            if (!game.state.ended) {
                game.stand();
            }

            let winnings = 0;
            if (game.state.player_multiplier != 0) winnings = (((game.state.player_multiplier * bet) - bet) * 0.75) + bet;
            require('../utility/credits').refund(discord_client, msg.author.id, winnings); // credits manager refunds on error
            this.print_blackjack(msg, game.print_game(), winnings);
        });

        collector.on('collect', m => {
            if (m.content.toLowerCase().includes('hit')) {
                collector.resetTimer();
                game.hit();
                if (game.state.ended) {
                    collector.stop();
                }
                else {
                    this.print_blackjack(msg, game.print_game());
                }
            }
            else if (m.content.toLowerCase().includes('stand') || m.content.toLowerCase().includes('stay') || m.content.toLowerCase().includes('hold') || m.content.toLowerCase().includes('pass') || m.content.toLowerCase().includes('+blackjack') || m.content.toLowerCase().includes('+bj')) {
                collector.stop();
            }
        });

        if (game.state.ended) {
            collector.stop();
        }
        else {
            this.print_blackjack(msg, game.print_game());
        }
    },
    async print_blackjack(msg, game, winnings) {
        const { MessageEmbed } = require('discord.js');

        let blackjack_embed = new MessageEmbed();

        if (game.state.ended) {
            let outcome = game.state.player_multiplier > 0 ? 'Won' : 'Lost';
            blackjack_embed.addField(`Results: ${outcome}`, `Winnings: ${winnings.toFixed(2)}`);
        }

        blackjack_embed.setTitle(`Blackjack`)
            // .setDescription(`blackjack description text.`)
            .setColor('#000000')
            .addField(`Player: ${game.player_score}`, `Cards: ${game.player_cards.map(card => card.rank + card.suit).join(' ')}`, false)
            .addField(`Dealer: ${game.dealer_score}`, `Cards: ${game.dealer_cards.map(card => card.rank + card.suit).join(' ')}`, false)
            .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
            .setTimestamp();

        msg.channel.send({ embeds: [blackjack_embed] });
        return;
    }
}