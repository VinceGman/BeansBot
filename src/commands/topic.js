const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config(); // .env values

// https://console.cloud.google.com/apis/dashboard?project=beans-326017&show=all
// https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'topic',
    description: "topic change in topic chat",
    category: 'utility',
    scopes: ['1164800357533220907'],
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        let cooldown_amount = 30;

        let current_time = Math.floor(Date.now() / 1000);
        let next_time = +(await db.doc('values/topic').get())._fieldsProto[msg.channel.id]?.stringValue ?? 0;

        let next_available = current_time + (cooldown_amount * 60);
        let time_shown = next_time;

        let topic_embed = new EmbedBuilder()
            .setTitle(`Topic Change`)
            .setDescription(`+topic (name) -> +topic pokemon`)
            .setColor(`#000000`)
            .setFooter({ text: `requested by ${msg.author.username}` })
            .setTimestamp();

        if (current_time >= next_time) {
            if (args.length >= 1) {
                await db.doc('values/topic').set({
                    [msg.channel.id]: next_available.toString()
                }, { merge: true }).then((res, rej) => {
                    if (res) {
                        // time_change = true;
                    }
                });

                await msg.channel.setName(args.join('-')).then((res, rej) => {
                    if (rej) {
                        topic_embed.addFields({ name: "Discord API Failed", value: "The channel name change could not be completed.", inline: false });
                    }
                    else {
                        topic_embed.addFields({ name: `Name Changed`, value: `#${msg.channel.name}`, inline: true });
                    }
                });

                time_shown = next_available;
                topic_embed.addFields({ name: 'Cooldown', value: `Available <t:${time_shown}:R>.`, inline: true });
            }
            else {
                topic_embed.addFields({ name: 'Cooldown', value: `Available Now.`, inline: true });
            }
        }
        else {
            topic_embed.addFields({ name: 'Cooldown', value: `Available <t:${time_shown}:R>.`, inline: true });
        }

        msg.channel.send({ embeds: [topic_embed] });
    }
}