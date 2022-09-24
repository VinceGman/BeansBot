const { MessageEmbed } = require('discord.js');
const wrapText = require("wrap-text");
let textWrap = 31;
let timer = {};
let cooldown = 4;

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
    name: 'show',
    description: "look at a character",
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        if (args.length == 0) {
            let show_guide = new MessageEmbed()
                .setTitle(`Show Guide`)
                .setColor('#000000')
                .addField('+show 123', `shows card with rank #123`, false)
                .addField('+show Nezuko Kamado', `shows card with name 'Nezuko Kamado'`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [show_guide] });
            return;
        }

        let current_time = Math.floor(Date.now() / 1000);
        if (timer.hasOwnProperty(msg.author.id.toString())) {
            if (current_time < timer[msg.author.id.toString()] + cooldown) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Show Cooldown: <t:${timer[msg.author.id.toString()] + cooldown}:R>`);
                return;
            }
        }
        timer[msg.author.id.toString()] = current_time;

        let character = {};

        if (args.length == 1 && !isNaN(args[0])) {
            try {
                character.mal = (await db.doc(`edition_one/${args[0]}`).get())._fieldsProto;
                if (character.mal == null) {
                    msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Character not found.`);
                    return;
                }
            }
            catch (err) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - System Error: Anime API Failed`);
                return;
            }
        }
        else {
            try {
                let query = await db.collection(`edition_one`).where('name', '==', args.join(' ')).get();
                if (query._docs()[0] == null) {
                    msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Character not found.`);
                    return;
                }
                character.mal = query._docs()[0]._fieldsProto;
            }
            catch (err) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - System Error: Anime API Failed`);
                return;
            }
        }

        character.rank = +character.mal.rank.stringValue;

        let stars = '★';
        let color = '#FFFFFF';
        let rarity = 'Common';

        if (character.rank <= 4000) {
            stars = '★★';
            color = '#7aaf74';
            rarity = 'Uncommon';
        }
        if (character.rank <= 1000) {
            stars = '★★★';
            color = '#0070DD';
            rarity = 'Rare';
        }
        if (character.rank <= 400) {
            stars = '★★★★';
            color = '#c369ec';
            rarity = 'Epic';
        }
        if (character.rank <= 100) {
            stars = '★★★★★';
            color = '#ffab4b';
            rarity = 'Legendary';
        }
        if (character.rank <= 10) {
            stars = '★★★★★★';
            color = '#fc5d65';
            rarity = 'Ultimate';
        }

        let character_embed = new MessageEmbed()
            .setTitle(`${wrapText(character.mal.name.stringValue, textWrap)}`)
            .setDescription(`${wrapText(character.mal.origin.stringValue, textWrap)}`)
            .setImage(`${character.mal.image.stringValue}`)
            .setColor(color) // #ffa31a
            .addField('Rank', `#${character.rank}`, true)
            .addField('Rarity', `${rarity} - ${stars}`, true)
            .setFooter({ text: wrapText(`ED1 - ${msg.author.username}#${msg.author.discriminator}`, textWrap) })
            .setTimestamp();

        msg.channel.send({ embeds: [character_embed] });

    }
}