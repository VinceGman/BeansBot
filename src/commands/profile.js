const { MessageEmbed } = require('discord.js');
const wrapText = require("wrap-text");
let textWrap = 31;
let timer = {};
let cooldown = 6;

// https://console.cloud.google.com/apis/dashboard?project=beans-326017&show=all
// https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'profile',
    description: "shows your collectibles",
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        let current_time = Math.floor(Date.now() / 1000);
        if (timer.hasOwnProperty(msg.author.id.toString())) {
            if (current_time < timer[msg.author.id.toString()] + cooldown) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Profile Cooldown: <t:${timer[msg.author.id.toString()] + cooldown}:R>`);
                return;
            }
        }
        timer[msg.author.id.toString()] = current_time;

        let user = (await db.doc(`members/${msg.author.id}`).get())._fieldsProto;
        let pulls = (await db.collection('cards').where('owner_id', '==', msg.author.id).get())._docs();
        let amount;
        if (user != null) {
            amount = +user.credits.stringValue;
        }
        else {
            amount = 12000;
        }

        let owned = [];
        pulls.forEach(p => {
            owned.push({ name: p._fieldsProto.name.stringValue, rank: +p._fieldsProto.rank.stringValue, stars: p._fieldsProto.stars.stringValue, protected: p._fieldsProto.protected.booleanValue, for_sale: p._fieldsProto.for_sale.booleanValue });
        });

        owned.sort((a, b) => (a.rank > b.rank) ? 1 : -1);

        let ownedText = '';
        let i = 0;
        while (ownedText.length <= 920 && i < owned.length) {
            let lock = '';
            if (owned[i].protected) {
                lock = ' - 🔒';
            }
            let sale = '';
            if (owned[i].for_sale) {
                sale = ' - ✅'
            }
            ownedText += `${owned[i].name}${lock}${sale} - #${owned[i].rank} - ${owned[i].stars}\n`;
            i++;
        }

        ownedText = ownedText == '' ? '[none]' : ownedText;

        let profile_embed = new MessageEmbed()
            .setTitle(`${wrapText(msg.author.username, textWrap)}`)
            .addField('Currency', `${amount} credits`, false)
            .addField('W&H Owned', `${ownedText}`, false)
            .setThumbnail(msg.author.avatarURL())
            .setColor(`#ADD8E6`)
            .setFooter({ text: wrapText(`BHP Profile`, textWrap) })
            .setTimestamp();

        msg.channel.send({ embeds: [profile_embed] });
    }
}