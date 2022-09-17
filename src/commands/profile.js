const { MessageEmbed } = require('discord.js');
const wrapText = require("wrap-text");
let textWrap = 31;

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
        let user = (await db.doc(`members/${msg.author.id}`).get())._fieldsProto;
        let pulls = (await db.collection('cards').where('owner_id', '==', msg.author.id).get())._docs();
        let amount;
        if (user != null) {
            amount = +user.credits.stringValue;
        }
        else {
            amount = 12000;
        }

        let owned = '';
        pulls.forEach(p => { owned += `${p._fieldsProto.name.stringValue} - ${p._fieldsProto.stars.stringValue}\n`; });
        owned = owned == '' ? '[none]' : owned.substring(0, 974);

        // let profile_embed = new MessageEmbed()
        //     .addField('Currency', `${amount} credits`, false)
        //     .addField('W&H Owned', `${wrapText(owned, textWrap)}`, false)
        //     .setAuthor({ name: msg.author.username, iconURL: msg.author.avatarURL() })
        //     .setColor(`#ADD8E6`)
        //     .setFooter({ text: wrapText(`BHP Profile`, textWrap) })
        //     .setTimestamp();

        let profile_embed = new MessageEmbed()
            .setTitle(`${wrapText(msg.author.username, textWrap)}`)
            .addField('Currency', `${amount} credits`, false)
            .addField('W&H Owned', `${owned}`, false)
            .setThumbnail(msg.author.avatarURL())
            .setColor(`#ADD8E6`)
            .setFooter({ text: wrapText(`BHP Profile`, textWrap) })
            .setTimestamp();
        // \n${msg.author.username}#${msg.author.discriminator} - ${pulls} owned
        // .setTitle(`${wrapText(msg.author.username, textWrap)}`)
        // .setDescription(`${wrapText('wahh', textWrap)}`)

        msg.channel.send({ embeds: [profile_embed] });
    }
}