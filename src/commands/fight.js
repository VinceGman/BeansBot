
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

let delay = 2000;

module.exports = {
    name: 'duel',
    alias: ['fight'],
    description: "Duelyst game mode",
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let fight_guide = new MessageEmbed()
                .setTitle(`Duel Guide`)
                .setDescription(`Duelyst Fight, you'll need one of these -> **+stack**`)
                .setColor('#000000')
                .addField('+duel @person', `You'll fight @person with your stacks.`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [fight_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        if (!msg.mentions.members.first()?.id) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - You must @person for who you want to fight.`);
            return;
        }

        delay = 2000;
        for (let arg of args) {
            if (!isNaN(arg) && +arg >= 1000 && +arg <= 6000) {
                delay = +arg;
            }
            if (arg.toLowerCase() == 'slow') {
                delay = 6000;
            }
            if (arg.toLowerCase() == 'fast') {
                delay = 1000;
            }
        }

        let team = await this.getTeam(msg, msg.author.id);
        let team2 = await this.getTeam(msg, msg.mentions.members.first().id);

        if (!team || !team2) return;

        await this.run_game(team, team2, msg);
    },
    async run_game(stack_left, stack_right, msg) {
        let new_stack_left = [...stack_left];
        let new_stack_right = [...stack_right];

        const { MessageEmbed } = require('discord.js');

        let stack_left_text = this.stack_text(new_stack_left, false);
        let stack_right_text = this.stack_text(new_stack_right, false);

        let fight_show = new MessageEmbed()
            .setTitle(`${msg.author.username} vs ${msg.mentions.members.first().user.username} - Start`)
            .setColor('#000000')
            .addField(`${msg.author.username}`, `${stack_left_text}`, false)
            .addField(`${msg.mentions.members.first().user.username}`, `${stack_right_text}`, false)
            .setFooter({ text: `Duelyst` })
            .setTimestamp();

        let fight_msg = await msg.channel.send({ embeds: [fight_show] });

        await new Promise(resolve => setTimeout(resolve, delay));

        // console.table(new_stack_left);
        new_stack_left = [...(await this.onspawn(msg, new_stack_left, new_stack_right, "Left", fight_msg))];

        // console.table(new_stack_right);
        new_stack_right = [...(await this.onspawn(msg, new_stack_left, new_stack_right, "Right", fight_msg))];

        let fight_onspawn = new MessageEmbed()
            .setTitle(`${msg.author.username} vs ${msg.mentions.members.first().user.username} - Onspawn`)
            .setColor('#000000')
            .addField(`${msg.author.username}`, `${this.stack_text(new_stack_left, false)}`, false)
            .addField(`${msg.mentions.members.first().user.username}`, `${this.stack_text(new_stack_right, false)}`, false)
            .setFooter({ text: `Duelyst` })
            .setTimestamp();

        fight_msg.edit({ embeds: [fight_onspawn] });

        await new Promise(resolve => setTimeout(resolve, delay));

        while (new_stack_left.length != 0 && new_stack_right.length != 0) {
            let fight_turn = new MessageEmbed()
                .setTitle(`${msg.author.username} vs ${msg.mentions.members.first().user.username}`)
                .setColor('#000000')
                .addField(`Fighting`, `(A${new_stack_left[0].attack} H${new_stack_left[0].health} T${new_stack_left[0].type}) vs (A${new_stack_right[0].attack} H${new_stack_right[0].health} T${new_stack_right[0].type})`)
                .addField(`${msg.author.username}`, `${this.stack_text(new_stack_left, false)}`, false)
                .addField(`${msg.mentions.members.first().user.username}`, `${this.stack_text(new_stack_right, false)}`, false)
                .setFooter({ text: `Duelyst` })
                .setTimestamp();

            fight_msg.edit({ embeds: [fight_turn] });

            let stacks = await this.turn(msg, new_stack_left, new_stack_right, fight_msg);
            new_stack_left = stacks[0];
            new_stack_right = stacks[1];

            await new Promise(resolve => setTimeout(resolve, delay));
        }

        let winner = false;
        if (new_stack_left.length == 0 && new_stack_right.length == 0) {
            winner = 'Draw';
        }
        else if (new_stack_left.length == 0) {
            winner = msg.mentions.members.first().user.username;
        }
        else if (new_stack_right.length == 0) {
            winner = msg.author.username;
        }

        let fight_end = new MessageEmbed()
            .setTitle(`${msg.author.username} vs ${msg.mentions.members.first().user.username}`)
            .setColor('#000000')
            .addField(`Winner`, `${winner}`, false)
            .setFooter({ text: `Duelyst` })
            .setTimestamp();

        fight_msg.edit({ embeds: [fight_end] });
    },
    async turn(msg, new_stack_left, new_stack_right, fight_msg) {
        if (new_stack_left[0].type == 5 || new_stack_right[0].type == 5) {
            // console.log('special character', '5: this card instantly deletes itself and the enemy card instead of hitting (does not proc prehit or posthit, theres no hit)');
            await this.interaction(msg, new_stack_left, new_stack_right, fight_msg, "Special Character 5 : Left or Right");
            new_stack_left.shift();
            new_stack_right.shift();
            // console.table(new_stack_left);
            // console.table(new_stack_right);
            return [[...new_stack_left], [...new_stack_right]];
        }

        // console.table(new_stack_left);
        new_stack_left = [...(await this.prehit(msg, new_stack_left, new_stack_right, "Left", fight_msg))];

        // console.table(new_stack_right);
        new_stack_right = [...(await this.prehit(msg, new_stack_left, new_stack_right, "Right", fight_msg))];

        let next_left = new_stack_left[0];
        let next_right = new_stack_right[0];

        if (new_stack_left[0].type != 2) {
            new_stack_left[0].health -= next_right.attack;
        }
        else {
            // console.log('special character', '2: invulnerable for first hit');
            await this.interaction(msg, new_stack_left, new_stack_right, fight_msg, "Special Character 2 : Left");
            new_stack_left[0].type = 1;
            // console.table(new_stack_left);
        }
        if (new_stack_left[0].health > 0) {
            // console.table(new_stack_left);
            new_stack_left = [...(await this.posthit(msg, new_stack_left, new_stack_right, "Left", fight_msg))];
        }
        else {
            if (new_stack_left[0].type == 13) {
                // console.log('special character', '13: when this dies, it moves to the back of the stack and becomes a 3/3/1');
                await this.interaction(msg, new_stack_left, new_stack_right, fight_msg, "Special Character 13 : Left");
                let this_card = { ...new_stack_left[0] };
                this_card.attack = 3;
                this_card.health = 3;
                this_card.type = 1;
                new_stack_left.push(this_card);
            }
            new_stack_left.shift();
            // console.table(new_stack_left);
        }

        if (new_stack_right[0].type != 2) {
            new_stack_right[0].health -= next_left.attack;
        }
        else {
            // console.log('special character', '2: invulnerable for first hit');
            await this.interaction(msg, new_stack_left, new_stack_right, fight_msg, "Special Character 2 : Right");
            new_stack_right[0].type = 1;
            // console.table(new_stack_right);
        }
        if (new_stack_right[0].health > 0) {
            // console.table(new_stack_right);
            new_stack_right = [...(await this.posthit(msg, new_stack_left, new_stack_right, "Right", fight_msg))];
        }
        else {
            if (new_stack_right[0].type == 13) {
                // console.log('special character', '13: when this dies, it moves to the back of the stack and becomes a 3/3/1');
                await this.interaction(msg, new_stack_left, new_stack_right, fight_msg, "Special Character 13 : Right");
                let this_card = { ...new_stack_right[0] };
                this_card.attack = 3;
                this_card.health = 3;
                this_card.type = 1;
                new_stack_right.push(this_card);
            }
            new_stack_right.shift();
            // console.table(new_stack_right);
        }

        return [[...new_stack_left], [...new_stack_right]];
    },
    async onspawn(msg, stack, other_stack, side, fight_msg) {
        let new_stack;
        if (side == "Left") {
            new_stack = [...stack];
        }
        else {
            new_stack = [...other_stack];
        }
        let i = 0;
        while (i < new_stack.length) {
            switch (new_stack[i].type) { // 3, 8, 12, 16
                case 3:
                    // console.log('onspawn', '3: creates a 1/1 duplicate of your last card and makes it the first card in your stack');
                    await this.interaction(msg, stack, other_stack, fight_msg, `Onspawn ${new_stack[i].type} : ${side}`);
                    let last_card = { ...new_stack[new_stack.length - 1] };
                    last_card.attack = 1;
                    last_card.health = 1;
                    new_stack.unshift(last_card);
                    i++;
                    // console.table(new_stack);
                    break;
                case 8:
                    // console.log('onspawn', '8: gives first card +5/+5');
                    await this.interaction(msg, stack, other_stack, fight_msg, `Onspawn ${new_stack[i].type} : ${side}`);
                    new_stack[0].attack += 5;
                    new_stack[0].health += 5;
                    // console.table(new_stack);
                    break;
                case 12:
                    // console.log('onspawn', '12: gain 6 health');
                    await this.interaction(msg, stack, other_stack, fight_msg, `Onspawn ${new_stack[i].type} : ${side}`);
                    new_stack[i].health += 6;
                    // console.table(new_stack);
                    break;
                case 16:
                    // console.log('onspawn', '16: entire team receives +1/+1/+1');
                    await this.interaction(msg, stack, other_stack, fight_msg, `Onspawn ${new_stack[i].type} : ${side}`);
                    for (let j = 0; j < new_stack.length; j++) {
                        new_stack[j].attack += 1;
                        new_stack[j].health += 1;
                        new_stack[j].type += 1;
                        new_stack[j].type = new_stack[j].type > 16 ? 16 : new_stack[j].type;
                    }
                    // console.table(new_stack);
                    break;
                default:
            }
            // await new Promise(resolve => setTimeout(resolve, 1000));
            i++;
        }
        return new_stack;
    },
    async prehit(msg, stack, other_stack, side, fight_msg) {
        let new_stack;
        if (side == "Left") {
            new_stack = [...stack];
        }
        else {
            new_stack = [...other_stack];
        }
        switch (new_stack[0].type) { // 6, 9, 11, 14
            case 6:
                // console.log('prehit', '6: if this is your only card left, it receives +2/+2');
                await this.interaction(msg, stack, other_stack, fight_msg, `Prehit ${new_stack[0].type} : ${side}`);
                if (new_stack.length == 1) {
                    new_stack[0].attack += 2;
                    new_stack[0].health += 2;
                }
                // console.table(new_stack);
                break;
            case 9:
                // console.log('prehit', '9: increases type of last card by 1');
                await this.interaction(msg, stack, other_stack, fight_msg, `Prehit ${new_stack[0].type} : ${side}`);
                new_stack[new_stack.length - 1].type += 1;
                new_stack[new_stack.length - 1].type = new_stack[new_stack.length - 1].type > 16 ? 16 : new_stack[new_stack.length - 1].type;
                // console.table(new_stack);
                break;
            case 11:
                // console.log('prehit', '11: gain 2 attack');
                await this.interaction(msg, stack, other_stack, fight_msg, `Prehit ${new_stack[0].type} : ${side}`);
                new_stack[0].attack += 2;
                // console.table(new_stack);
                break;
            case 14:
                // console.log('prehit', '14: become a copy of the card right behind it, but keeps its health');
                await this.interaction(msg, stack, other_stack, fight_msg, `Prehit ${new_stack[0].type} : ${side}`);
                if (new_stack.length > 1) {
                    new_stack[0].name = new_stack[1].name;
                    new_stack[0].attack = new_stack[1].attack;
                    new_stack[0].type = new_stack[1].type;
                }
                // console.table(new_stack);
                break;
            default:
        }
        // await new Promise(resolve => setTimeout(resolve, 1000));
        return new_stack;
    },
    async posthit(msg, stack, other_stack, side, fight_msg) {
        let new_stack;
        if (side == "Left") {
            new_stack = [...stack];
        }
        else {
            new_stack = [...other_stack];
        }
        switch (new_stack[0].type) { // 4, 7, 10, 15
            case 4:
                // console.log('posthit', '4: gives the card behind it +2/+2');
                await this.interaction(msg, stack, other_stack, fight_msg, `Posthit ${new_stack[0].type} : ${side}`);
                if (new_stack.length > 1) {
                    new_stack[1].attack += 2;
                    new_stack[1].health += 2;
                }
                // console.table(new_stack);
                break;
            case 7:
                // console.log('posthit', '7: it spawns a 1/1 version of itself at the back of the stack');
                await this.interaction(msg, stack, other_stack, fight_msg, `Posthit ${new_stack[0].type} : ${side}`);
                let this_card = { ...new_stack[0] };
                this_card.attack = 1;
                this_card.health = 1;
                new_stack.push(this_card);
                // console.table(new_stack);
                break;
            case 10:
                // console.log('posthit', '10: move to the back of the stack');
                await this.interaction(msg, stack, other_stack, fight_msg, `Posthit ${new_stack[0].type} : ${side}`);
                let curr_card = { ...new_stack[0] };
                new_stack.shift();
                new_stack.push(curr_card);
                // console.table(new_stack);
                break;
            case 15:
                // console.log('posthit', '15: flip attack and health');
                await this.interaction(msg, stack, other_stack, fight_msg, `Posthit ${new_stack[0].type} : ${side}`);
                let new_health = new_stack[0].attack;
                let new_attack = new_stack[0].health;
                new_stack[0].attack = new_attack;
                new_stack[0].health = new_health;
                // console.table(new_stack);
                break;
            default:
        }
        // await new Promise(resolve => setTimeout(resolve, 1000));
        return new_stack;
    },
    async getTeam(msg, id) {
        let db_user = await require('../utility/queries').user(id);

        let team = db_user?.[`stack_${1}`] ?? {};
        for (let i = 0; i < team.length; i++) {
            team[i] = { name: team[i].name, attack: +team[i].attack, health: +team[i].health, type: +team[i].type };
        }

        if (Object.keys(team).length == 0) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - This player has no stack yet -> **+stack**`);
            return false;
        }

        return team;
    },
    stack_text(stack, backwards) {
        let text = '';
        if (backwards) {
            for (let i = stack.length - 1; i >= 0; i--) {
                text += `(A${stack[i].attack} H${stack[i].health} T${stack[i].type}) `;
            }
        }
        else {
            for (let i = 0; i < stack.length; i++) {
                text += `(A${stack[i].attack} H${stack[i].health} T${stack[i].type}) `;
            }
        }
        return text;
    },
    async assign_values(num, type) {
        var current = (await db.doc(`edition_one/${num}`).get())._fieldsProto;

        let value = 0;
        switch (current.rarity.stringValue) {
            case 'Common':
                value = 0;
                break;
            case 'Uncommon':
                value = 1;
                break;
            case 'Rare':
                value = 2;
                break;
            case 'Epic':
                value = 3;
                break;
            case 'Legendary':
                value = 4;
                break;
            case 'Ultimate':
                value = 5;
                break;
            default:
                value = 0;
        }

        const res = await db.doc(`edition_one/${num}`).update({
            attack: Math.floor(Math.random() * (3 + value)) + 1 + Math.floor(value / 4),
            health: Math.floor(Math.random() * (3 + value)) + 1 + Math.floor(value / 4),
            type: type,
        }).catch(err => console.log('Error', err));
    },
    async interaction(msg, new_stack_left, new_stack_right, fight_msg, interaction) {
        await new Promise(resolve => setTimeout(resolve, delay / 2));

        const { MessageEmbed } = require('discord.js');

        let fight_interaction = new MessageEmbed()
            .setTitle(`${msg.author.username} vs ${msg.mentions.members.first().user.username} - Interaction`)
            .setColor('#000000')
            .setDescription(interaction)
            .addField(`Fighting`, `(A${new_stack_left[0].attack} H${new_stack_left[0].health} T${new_stack_left[0].type}) vs (A${new_stack_right[0].attack} H${new_stack_right[0].health} T${new_stack_right[0].type})`)
            .addField(`${msg.author.username}`, `${this.stack_text(new_stack_left, false)}`, false)
            .addField(`${msg.mentions.members.first().user.username}`, `${this.stack_text(new_stack_right, false)}`, false)
            .setFooter({ text: `Duelyst` })
            .setTimestamp();

        fight_msg.edit({ embeds: [fight_interaction] });
    }
}

// const _ = require("lodash");

// let cards = [];
// for (let i = 1; i <= 20000; i++) {
//     cards.push(i);
// }

// let shuffled = _.shuffle(cards);

// for (let i = 0; i < 20000; i++) {
//     let type = ((i + 1) % 16) + 1;
//     // console.log(i, 'called', shuffled[i], type);
//     await this.assign_values(shuffled[i], type);
// }

/*

you must have 6 cards from that collection to use the collection or own 20% of it or more
you can use 2 collections in a stack 
stats: attack | health | type

onspawn:
prehit:
(must survive and must hit to trigger) posthit:

X type 1: no passive
X type 2: invulnerable for first hit
X type 3: onspawn: creates a 1/1 duplicate of your last card and makes it the first card in your stack
X type 4: posthit: gives the card behind it +2/+2
X type 5: this card instantly deletes itself and the enemy card instead of hitting (does not proc prehit or posthit or special character types)
X type 6: prehit: if this is your only card left, it receives +2/+2
X type 7: posthit: you spawns a 1/1 version of itself at the back of the stack
X type 8: onspawn: gives first card +5/+5
X type 9: prehit: increases type of last card by 1
X type 10: posthit: move to the back of the stack
X type 11: prehit: gain 2 attack
X type 12: onspawn: gain 6 health
X type 13: when this dies, it moves to the back of the stack and becomes a 3/3/1
X type 14: prehit: become a copy of the card right behind it, but doesn't copy health
X type 15: posthit: flip attack and health
X type 16: onspawn: entire team receives +1/+1/+1

*/