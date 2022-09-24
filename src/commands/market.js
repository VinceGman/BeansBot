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
    description: "shows what a card is selling for",
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        if (args.length == 0) {
            let market_guide = new MessageEmbed()
                .setTitle(`Market Guide`)
                .setDescription('You can see how much a card is being sold at on the market.')
                .setColor('#000000')
                .addField('+market Nezuko Kamado 123', `shows the market price for the card 'Nezuko Kamado' with rank #123`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [market_guide] });
            return;
        }

        let current_time = Math.floor(Date.now() / 1000);
        if (timer.hasOwnProperty(msg.author.id.toString())) {
            if (current_time < timer[msg.author.id.toString()] + cooldown) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Market Cooldown: <t:${timer[msg.author.id.toString()] + cooldown}:R>`);
                return;
            }
        }
        timer[msg.author.id.toString()] = current_time;

        let rank = args.pop();
        let character = await db.collection(`cards`).where('for_sale', '==', true).where('name', '==', args.join(' ')).where('rank', '==', rank).orderBy('selling_price', 'asc').get();
        if (character._docs()[0] == null) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - There could be no listings. Check that it's the right information. +market <name> <rank>`);
            return;
        }

        character = character._docs()[0]._fieldsProto;

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