
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'rolls',
    alias: ['roll'],
    alias_show: [],
    description: "reset rolls",
    category: 'cards',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        if (args.length != 1) {
            this.rolls_guide(msg);
            return;
        }
        else if (args[0].toLowerCase() == 'reset') {
            let cost = 100000;
            if (!(await require('../utility/credits').transaction(discord_client, msg, cost))) return; // credits manager validates transaction

            await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
                lootbox_flips_per_hour: "0",
                lootbox_flips_timestamp: "0",
            }, { merge: true });

            let rolls_embed = new EmbedBuilder()
                .setTitle(`Rolls Reset`)
                .setColor('#000000')
                .addFields({ name: 'Cost', value: `100,000 credits`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [rolls_embed] });
            return;
        }
        else {
            this.rolls_guide(msg);
            return;
        }
    },
    async rolls_guide(msg) {
        let rolls_guide = new EmbedBuilder()
            .setTitle(`Rolls Guide`)
            .setColor('#000000')
            .addFields({ name: '+rolls reset', value: `resets your hourly rolls\nCost: 100,000 credits`, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [rolls_guide] });
    }
}