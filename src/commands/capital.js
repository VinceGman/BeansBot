
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

let example_max_income = 20000;

let types = ['Glyphix', 'Anagram'];

module.exports = {
    name: 'capital',
    alias: ['cap', ...types.map(t => t.toLowerCase())],
    alias_show: [],
    description: "earn credits with capital games",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        if (args.length == 0) {
            this.show_puzzle(msg, args);
            return;
        }
        else if (['guide', 'example', 'ex'].includes(args.join(' ').toLowerCase())) {
            this.capital_guide(msg);
            return;
        }
        else if (['skip'].includes(args.join(' ').toLowerCase())) {
            await db.doc(`members/${msg.author.id}`).set({
                capital_puzzle: FieldValue.delete(),
            }, { merge: true });

            await require('../utility/embeds').notice_embed(discord_client, msg, "Your current puzzle has been skipped.", '#ebcf34');
            return;
        }
        else {
            let db_user = await require('../utility/queries').user(msg.author.id);
            let capital_income = db_user?.[`capital_income_${db_user?.capital_puzzle?.type}`] ? +db_user[`capital_income_${db_user?.capital_puzzle?.type}`] : 0;

            if (db_user?.capital_puzzle) {
                let capital_puzzle = db_user.capital_puzzle;
                if (capital_puzzle.solution.toLowerCase() == args.join(' ').toLowerCase()) {
                    require('../utility/credits').refund(discord_client, msg.author.id, +capital_puzzle.pay); // credits manager refunds on error

                    capital_income += +capital_puzzle.pay;

                    await db.doc(`members/${msg.author.id}`).set({
                        capital_puzzle: FieldValue.delete(),
                        [`capital_income_${capital_puzzle.type}`]: capital_income.toString(),
                    }, { merge: true });

                    let pay_result = new EmbedBuilder()
                        .setTitle(`Capital Payment`)
                        .setColor('#37914f')
                        .addFields({ name: `Solution`, value: `${capital_puzzle.solution}`, inline: true })
                        .addFields({ name: `Amount`, value: `+${comma_adder.add(Math.trunc(capital_puzzle.pay))} credits`, inline: true })
                        .setFooter({ text: `${msg.author.username}` })
                        .setTimestamp();

                    msg.channel.send({ embeds: [pay_result] });
                    return;
                }
                else {
                    await require('../utility/embeds').notice_embed(discord_client, msg, "Incorrect Solution.", '#fe3939');
                    return;
                }
            }
            else {
                this.show_puzzle(msg, args);
                return;
            }
        }
    },
    async capital_guide(msg) {
        let db_user = await require('../utility/queries').user(msg.author.id);
        let capital_puzzle = db_user?.capital_puzzle;

        let capital_guide = new EmbedBuilder()
            .setTitle(`Capital Games - Guide & Example`)
            .setDescription(`Solve a puzzle to earn credits.`)
            .setColor('#000000')
            .addFields({ name: '+capital', value: `Shows your current puzzle.`, inline: false })
            .addFields({ name: '+capital ABCDE', value: `Submits "ABCDE" as puzzle solution.`, inline: false })
            .addFields({ name: '+capital skip', value: `Skips your current puzzle.`, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        if (capital_puzzle?.type) {
            try {
                let capital_income = db_user?.[`capital_income_${capital_puzzle.type}`] ? +db_user[`capital_income_${capital_puzzle.type}`] : 0;
                if (capital_income < example_max_income) {
                    let example_puzzle = await this[capital_puzzle.type.toLowerCase()](0);
                    capital_guide.addFields({ name: `${capital_puzzle.type} - Example`, value: `\`\`\`\nExample:\n${example_puzzle.puzzle}\n\nSolution:\n${example_puzzle.solution}\n\`\`\``, inline: false });
                }
            }
            catch (err) {
                // console.log(err);
            }
        }

        msg.channel.send({ embeds: [capital_guide] });
    },
    async show_puzzle(msg, args) {
        let db_user = await require('../utility/queries').user(msg.author.id);
        let capital_puzzle = db_user?.capital_puzzle ? db_user.capital_puzzle : await this.generate_puzzle(msg, args);
        let capital_income = db_user?.[`capital_income_${capital_puzzle.type}`] ? +db_user[`capital_income_${capital_puzzle.type}`] : 0;

        let capital_puzzle_embed = new EmbedBuilder()
            .setColor('#000000')
            .addFields({ name: `Puzzle - ${capital_puzzle.type}`, value: `\`\`\`\n${capital_puzzle.puzzle}\n\`\`\``, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        if (capital_income <= example_max_income) {
            capital_puzzle_embed.addFields({ name: `Example`, value: `\`\`\`\n+capital example\n\`\`\``, inline: false })
        }

        msg.channel.send({ embeds: [capital_puzzle_embed] });
    },
    async generate_puzzle(msg, args) {
        const { Searcher } = require("fast-fuzzy");
        const types_searcher = new Searcher(types, { returnMatchData: true });

        let get_puzzle_method;
        if (args.length == 0) {
            if (!msg.content.slice(1).toLowerCase().includes('cap')) {
                get_puzzle_method = msg.content.slice(1).toLowerCase();
            }
            else {
                get_puzzle_method = types[Math.floor(Math.random() * types.length)];
            }
        }
        else {
            get_puzzle_method = args.join(' ').toLowerCase();
        }

        let type;
        try {
            type = types_searcher.search(get_puzzle_method)[0].key;
        }
        catch (err) {
            type = 'glyphix';
        }

        let db_user = await require('../utility/queries').user(msg.author.id);
        let capital_income = db_user?.[`capital_income_${type}`] ? +db_user[`capital_income_${type}`] : 0;

        let capital_puzzle = await this[type](capital_income);

        await db.doc(`members/${msg.author.id}`).set({
            capital_puzzle: capital_puzzle,
        }, { merge: true });

        return capital_puzzle;
    },
    async glyphix(capital_income) {
        let type = 'Glyphix';

        let numbers = '';
        let letters = '';
        let solution = '';

        let problem_length = Math.floor(capital_income / 192000) + 5;
        let pay = (problem_length * 400).toString();

        let numbers_range = Math.min((Math.floor(capital_income / 48000) + 3), 9);
        let letters_range = Math.min((Math.floor(capital_income / 48000) + 3), 26);

        for (let i = 0; i < problem_length; i++) {
            let number_RNG = Math.floor(Math.random() * numbers_range) + 1;
            let letter_RNG = Math.floor(Math.random() * letters_range) + 1;
            numbers += number_RNG;
            letters += String.fromCharCode(letter_RNG + 64);
            solution += String.fromCharCode(((letter_RNG + number_RNG - 1) % 26) + 65);
        }

        let puzzle = `${numbers}\n${letters}`;

        return { puzzle: puzzle, solution: solution, type: type, pay: pay }
    },
    async anagram(capital_income) {
        let type = 'Anagram';

        const { generate } = await import('random-words');

        let solution = generate({ minLength: Math.min((Math.floor(capital_income / 48000) + 4), 26) });
        let puzzle = require('lodash').shuffle(solution).join('');
        let pay = (puzzle.length * 400).toString();

        return { puzzle: puzzle, solution: solution, type: type, pay: pay };
    }
}