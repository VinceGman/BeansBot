const { MessageEmbed } = require('discord.js');
const wrapText = require("wrap-text");
let textWrap = 31;
let cooldown = 16;

// save all cards, make editions
// queue them in the database for really fast grabs

// https://www.npmjs.com/package/boxen

// https://console.cloud.google.com/apis/dashboard?project=beans-326017&show=all
// https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'income',
    description: "basic uninversal income",
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        let current_time = Math.floor(Date.now() / 1000);

        let user = (await db.doc(`members/${msg.author.id}`).get())._fieldsProto;

        let amount;
        let income;
        if (user != null) {
            amount = +user.credits.stringValue;
            if (user.income != null) {
                income = +user.income.stringValue
            }
            else {
                income = 0;
            }
        }
        else {
            amount = 12000;
            income = 0;
        }

        if ((income + (cooldown * 60 * 60)) <= current_time) {
            // available 
            income = current_time;
            amount += 19200;

            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Credits Earned: 19200 - Total: ${amount} - Cooldown: <t:${income + (cooldown * 60 * 60)}:R>`);
        }
        else {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Income Cooldown: <t:${income + (cooldown * 60 * 60)}:R>`);
            return;
        }

        await db.doc(`members/${msg.author.id}`).set({
            credits: amount.toString(),
            income: income.toString(),
        }, { merge: true });
    }
}