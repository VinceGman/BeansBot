const { MessageEmbed } = require('discord.js');
const wrapText = require("wrap-text");
let textWrap = 31;
let timer = {};
let cooldown = 10;

// https://console.cloud.google.com/apis/dashboard?project=beans-326017&show=all
// https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'sell',
    description: "sell your cards",
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        if (args.length == 0) {
            let sell_guide = new MessageEmbed()
                .setTitle(`Sell Guide`)
                .setDescription('To ensure you sell the product you intend, you now must specify rank at listing.')
                .setColor('#000000')
                .addField('+sell Nezuko Kamado 123 10000', `lists card 'Nezuko Kamado' with rank #123 at 10000 credits on the market`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [sell_guide] });
            return;
        }

        let current_time = Math.floor(Date.now() / 1000);
        if (timer.hasOwnProperty(msg.author.id.toString())) {
            if (current_time < timer[msg.author.id.toString()] + cooldown) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Sell Cooldown: <t:${timer[msg.author.id.toString()] + cooldown}:R>`);
                return;
            }
        }
        timer[msg.author.id.toString()] = current_time;

        let price = args.pop();
        if (isNaN(price)) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - +sell <name> <price>`);
            return;
        }
        else if (price < 0) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - +sell <name> <price>`);
            return;
        }

        let rank = args.pop();
        let character = await db.collection(`cards`).where('owner_id', '==', msg.author.id).where('name', '==', args.join(' ')).where('rank', '==', rank).get();
        if (character._docs()[0] == null) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Character not found. +sell <name> <rank> <price>`);
            return;
        }

        const res = await db.collection('cards').doc(`${character._docs()[0]._ref._path.segments[1]}`).update({
            for_sale: true,
            selling_price: price.toString(),
        }).catch(err => msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - This product wasn't stored properly. Please contact Sore#1414.`));

        msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Listed ${character._docs()[0]._fieldsProto.name.stringValue} for ${price} on the market.`);
    }
}