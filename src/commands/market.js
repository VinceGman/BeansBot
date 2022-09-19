const { MessageEmbed } = require('discord.js');
const wrapText = require("wrap-text");
let textWrap = 31;
let timer = {};
let cooldown = 15;

// https://console.cloud.google.com/apis/dashboard?project=beans-326017&show=all
// https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'market',
    description: "ask the market what's the deal",
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        let current_time = Math.floor(Date.now() / 1000);
        if (timer.hasOwnProperty(msg.author.id.toString())) {
            if (current_time < timer[msg.author.id.toString()] + cooldown) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Sell Cooldown: <t:${timer[msg.author.id.toString()] + cooldown}:R>`);
                return;
            }
        }
        timer[msg.author.id.toString()] = current_time;

        let character = await db.collection(`cards`).where('for_sale', '==', true).where('name', '==', args.join(' ')).orderBy('selling_price', 'asc').get();
        if (character._docs()[0] == null) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Character not found.`);
            return;
        }

        character = character._docs()[0]._fieldsProto;
        // console.log(character);

        // console.log(character._docs()[0]._fieldsProto, price);

        let character_embed = new MessageEmbed()
            .setTitle(`${wrapText(character.name.stringValue, textWrap)}`)
            .setDescription(`${wrapText(character.origin.stringValue, textWrap)}`)
            .setImage(`${character.image.stringValue}`)
            .setColor(character.color.stringValue) // #ffa31a
            .addField('Rank', `#${character.rank.stringValue}`, true)
            .addField('Rarity', `${character.rarity.stringValue} - ${character.stars.stringValue}`, true)
            .addField('Selling Price', `${character.selling_price.stringValue}`, false)
            .setFooter({ text: wrapText(`ED1 - ${msg.author.username}#${msg.author.discriminator}`, textWrap) })
            .setTimestamp();

        msg.channel.send({ embeds: [character_embed] });
    }
}