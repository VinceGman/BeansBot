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
    name: 'buy',
    description: "buy cards",
    admin: false,
    type: "test",
    async execute(discord_client, msg, args, admin) {
        if (args.length == 0) {
            let buy_guide = new MessageEmbed()
                .setTitle(`Buy Guide`)
                .setDescription('To ensure you get the product you want, you now must specify rank at purchase.')
                .setColor('#000000')
                .addField('+buy Nezuko Kamado 123', `buys card 'Nezuko Kamado' with rank #123 at lowest price offer`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [buy_guide] });
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

        let buyer = (await db.doc(`members/${msg.author.id}`).get())._fieldsProto;
        let buyer_amount;
        if (buyer != null) {
            buyer_amount = +buyer.credits.stringValue;
        }
        else {
            buyer_amount = 12000;
        }

        let rank = args.pop();

        let character = await db.collection(`cards`).where('for_sale', '==', true).where('name', '==', args.join(' ')).where('rank', '==', rank).orderBy('selling_price', 'asc').get();
        if (character._docs()[0] == null) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Character not found. +buy <name> <rank>`);
            return;
        }

        let char_ref = character;
        character = character._docs()[0]._fieldsProto;

        if (character.owner_id.stringValue == msg.author.id) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Can't buy your own card.`);
            return;
        }

        let seller = (await db.doc(`members/${character.owner_id.stringValue}`).get())._fieldsProto;
        let seller_amount;
        if (seller != null) {
            seller_amount = +seller.credits.stringValue;
        }
        else {
            seller_amount = 12000;
        }

        let cardCost = +character.selling_price.stringValue;

        if (buyer_amount < cardCost) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Not enough funds.`);
            return;
        }
        buyer_amount = (buyer_amount - cardCost).toString();
        seller_amount = (seller_amount + cardCost).toString();

        let character_embed = new MessageEmbed()
            .setTitle(`${wrapText(character.name.stringValue, textWrap)}`)
            .setDescription(`${wrapText(character.origin.stringValue, textWrap)}`)
            .setImage(`${character.image.stringValue}`)
            .setColor(character.color.stringValue) // #ffa31a
            .addField('Rank', `#${character.rank.stringValue}`, true)
            .addField('Rarity', `${character.rarity.stringValue} - ${character.stars.stringValue}`, true)
            .addField('Purchase Price', `${character.selling_price.stringValue}`, false)
            .setFooter({ text: wrapText(`ED1 - ${msg.author.username}#${msg.author.discriminator}`, textWrap) })
            .setTimestamp();

        msg.channel.send({ embeds: [character_embed] });

        await db.doc(`members/${msg.author.id}`).set({
            credits: buyer_amount
        }, { merge: true });

        await db.doc(`members/${character.owner_id.stringValue}`).set({
            credits: seller_amount
        }, { merge: true });

        const res = await db.collection('cards').doc(`${char_ref._docs()[0]._ref._path.segments[1]}`).update({
            owner_id: msg.author.id,
            for_sale: false,
            selling_price: "0",
        }).catch(err => msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - This product wasn't stored properly. Please contact Sore#1414.`));
    }
}