
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'currency',
    alias: ['credits', 'money', 'creds', 'c'],
    description: "show me the money",
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let db_user = await require('../utility/queries').user(msg.author.id);

        let currency_embed = new MessageEmbed()
            .addField('Currency', `${db_user.credits} credits`, false)
            .setTitle(`${db_user.pref_name ?? msg.author.username}`)
            .setThumbnail(db_user.pref_image ?? msg.author.avatarURL())
            .setColor(db_user.pref_color ?? `#ADD8E6`)
            .setFooter({ text: `Credits` })
            .setTimestamp();

        msg.channel.send({ embeds: [currency_embed] });
    }
}