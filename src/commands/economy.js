
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'economy',
    alias: ['eco'],
    description: "check the economy",
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        const members = await db.collection('members').get();
        let global = 0;
        let main_money = 0;
        members.forEach(doc => {
            if (doc.id == discord_client.user.id) {
                main_money = +doc.data().credits;
            }
            global += +doc.data().credits;
        });

        let fractional = 0.000085;

        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let buy_guide = new MessageEmbed()
                .setTitle(`Economy`)
                .setDescription(`Diagnostic Information`)
                .setColor('#37914f')
                .addField('Unclaimed Currency', `${main_money.toFixed(2)}`)
                .addField('Hourly Income', `${((main_money * fractional) * 0.75).toFixed(2)} + ${((main_money * fractional) * 0.25).toFixed(2)}`, false)
                .addField('Income Coefficient', `${fractional}`, false)
                .addField('Global Currency', `${global.toFixed(2)}`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [buy_guide] });
            return;
        }
    }
}