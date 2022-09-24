const { MessageEmbed } = require('discord.js');
const wrapText = require("wrap-text");
let textWrap = 31;
let timer = {};
let cooldown = 6;

// https://console.cloud.google.com/apis/dashboard?project=beans-326017&show=all
// https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'delist',
    description: "take a card off the market",
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        if (args.length == 0) {
            let delist_guide = new MessageEmbed()
                .setTitle(`Delist Guide`)
                .setDescription('If you no longer wish to sell a card, delist it. Note: using +sell on a card again will change the listing price without needing to delist.')
                .setColor('#000000')
                .addField('+delist Nezuko Kamado 123', `delists card 'Nezuko Kamado' with rank #123 from the market`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [delist_guide] });
            return;
        }

        let current_time = Math.floor(Date.now() / 1000);
        if (timer.hasOwnProperty(msg.author.id.toString())) {
            if (current_time < timer[msg.author.id.toString()] + cooldown) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Delist Cooldown: <t:${timer[msg.author.id.toString()] + cooldown}:R>`);
                return;
            }
        }
        timer[msg.author.id.toString()] = current_time;

        let rank = args.pop();
        let character = await db.collection(`cards`).where('owner_id', '==', msg.author.id).where('name', '==', args.join(' ')).where('rank', '==', rank).get();
        if (character._docs()[0] == null) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Character not found. +delist <name> <rank>`);
            return;
        }

        const res = await db.collection('cards').doc(`${character._docs()[0]._ref._path.segments[1]}`).update({
            for_sale: false,
            selling_price: "0",
        }).catch(err => msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - This product wasn't stored properly. Please contact Sore#1414.`));

        msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Delisted ${character._docs()[0]._fieldsProto.name.stringValue}.`);
    }
}