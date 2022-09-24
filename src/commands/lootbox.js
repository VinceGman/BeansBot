const fs = require('fs');
const { MessageEmbed } = require('discord.js');
const { Character } = require("@shineiichijo/marika")
const wrapText = require("wrap-text");
let textWrap = 31;
let cardCost = 1200;
let timer = {};
let cooldown = 6;

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
    name: 'lootbox',
    description: "rolls for 10000 collectibles",
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        let current_time = Math.floor(Date.now() / 1000);
        if (timer.hasOwnProperty(msg.author.id.toString())) {
            if (current_time < timer[msg.author.id.toString()] + cooldown) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Lootbox Cooldown: <t:${timer[msg.author.id.toString()] + cooldown}:R>`);
                return;
            }
        }
        timer[msg.author.id.toString()] = current_time;

        let user = (await db.doc(`members/${msg.author.id}`).get())._fieldsProto;
        let amount;
        if (user != null) {
            amount = +user.credits.stringValue;
        }
        else {
            amount = 12000;
        }

        if (amount < cardCost) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Not enough funds.`);
            return;
        }
        amount = (amount - cardCost).toString();

        ///////////////////////////////////////////////////////////////////////////////

        let character = { rank: Math.floor(Math.random() * 10000) + 1 }; // [1, 10000]
        try {
            character.mal = (await db.doc(`edition_one/${character.rank}`).get())._fieldsProto;
        }
        catch (err) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - System Error: Anime API Failed`);
            return;
        }

        /////////////////////////////////////////////////////////////////////////////////

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

        /////////////////////////////////////////////////////////////////////////////////

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

        await db.doc(`members/${msg.author.id}`).set({
            credits: amount
        }, { merge: true });

        await db.collection('cards').add({
            name: character.mal.name.stringValue.trim(),
            origin: character.mal.origin.stringValue,
            image: character.mal.image.stringValue,
            owner_id: msg.author.id,
            for_sale: false,
            selling_price: 0,
            stars: stars,
            color: color,
            rarity: rarity,
            edition: "1",
            rank: character.rank.toString(),
            protected: false,
            mal_id: character.mal.mal_id.stringValue,
        }).catch(err => msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - This product wasn't stored properly. Please contact Sore#1414.`));
    },
    async createCard(start, end, data, msg) {
        let character = {}; // [1, 10000]

        character.rank = start;

        character.id = +data[start - 1];

        character.mal = await character_client.getCharacterById(character.id).then((res, rej) => {
            return res;
        }).catch(err => {
            return undefined;
        });
        if (character.mal == null) {
            console.log(character.rank, 'mal error');
            await new Promise(r => setTimeout(r, 1500));
            this.createCard(start, end, data, msg);
            return;
        }

        let anime = await character_client.getCharacterAnime(character.id).then((res, rej) => {
            return res.data[0].anime.title;
        }).catch(err => {
            return undefined;
        });
        character.origin = "[none]";
        if (anime == null) {
            let manga = await character_client.getCharacterManga(character.id).then((res, rej) => {
                return res.data[0].manga.title;
            }).catch(err => {
                return undefined;
            });
            if (manga == null) {
                console.log(character.rank, 'origin error');
                await new Promise(r => setTimeout(r, 1500));
                this.createCard(start, end, data, msg);
                return;
            }
            else {
                character.origin = manga;
            }
        }
        else {
            character.origin = anime;
        }

        console.log(character.rank, character.id);

        await db.collection('edition_one').doc(`${start}`).set({
            rank: character.rank.toString(),
            name: character.mal.name,
            origin: character.origin,
            image: character.mal.images.webp.image_url,
            mal_id: character.id.toString(),
        }, { merge: true }).catch(err => { msg.channel.send(`${start} was not stored.`) });

        if (start < end) {
            this.createCard(++start, end, data, msg);
        }
    }
}