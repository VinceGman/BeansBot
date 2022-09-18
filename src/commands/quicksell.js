const { MessageEmbed } = require('discord.js');
const wrapText = require("wrap-text");
let textWrap = 31;
let timer = {};
let cooldown = 6;


// https://www.npmjs.com/package/boxen

// https://console.cloud.google.com/apis/dashboard?project=beans-326017&show=all
// https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'quicksell',
    description: "sell your cards back to the market",
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        let current_time = Math.floor(Date.now() / 1000);
        if (timer.hasOwnProperty(msg.author.id.toString())) {
            if (current_time < timer[msg.author.id.toString()] + cooldown) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Quicksell Cooldown: <t:${timer[msg.author.id.toString()] + cooldown}:R>`);
                return;
            }
        }
        timer[msg.author.id.toString()] = current_time;

        let character = await db.collection(`cards`).where('owner_id', '==', msg.author.id).where('name', '==', args.join(' ')).get();
        let reimburse = 0;
        if (character._docs()[0] == null) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Character not found.`);
            return;
        }
        switch (character._docs()[0]._fieldsProto.rarity.stringValue) {
            case 'Common':
                reimburse = 400;
                break;
            case 'Uncommon':
                reimburse = 800;
                break;
            case 'Rare':
                reimburse = 3600;
                break;
            case 'Epic':
                reimburse = 7200;
                break;
            case 'Legendary':
                reimburse = 14400;
                break;
            case 'Ultimate':
                reimburse = 28800;
                break;
            default:
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Character not found.`);
                return;
        }

        let res = await db.collection('cards').doc(`${character._docs()[0]._ref._path.segments[1]}`).delete();

        let user = (await db.doc(`members/${msg.author.id}`).get())._fieldsProto;
        let amount;
        if (user != null) {
            amount = +user.credits.stringValue;
        }
        else {
            amount = 12000;
        }

        amount += reimburse;

        await db.doc(`members/${msg.author.id}`).set({
            credits: amount.toString(),
        }, { merge: true });

        msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Reimbursed: ${reimburse} - Total Credits: ${amount}`);
    }
}