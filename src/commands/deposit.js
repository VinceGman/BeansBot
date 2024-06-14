// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

module.exports = {
    name: 'deposit',
    alias: ['dp'],
    description: "deposit a savings account",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        try {
            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            let { recipient, parsed_args } = await require('../utility/parsers').parse_user(msg, args, true);
            args = parsed_args;

            let db_user = await require('../utility/queries').user(msg.guildId, recipient);
            let savings = db_user?.savings ? db_user.savings : { credits: '0', joint: [] };
            let credits = +savings.credits;

            let { bet: amount } = await require('../utility/parsers').parse_payment(msg, args);

            if (!(await require('../utility/credits').transaction(discord_client, msg, +amount))) return; // credits manager validates transaction

            credits += +amount;

            await db.doc(`servers/${msg.guildId}/members/${recipient}`).set({
                savings: { credits: credits.toFixed(2).toString(), joint: savings.joint },
            }, { merge: true });

            let deposit_result = new EmbedBuilder()
                .setTitle(`Deposit Details`)
                .setColor('#37914f')
                // .setDescription(`Paid: ${+args[0]}`)
                // .addFields({ name: 'From', value: `${msg.author.username}`, inline: true })
                .addFields({ name: `Savings`, value: `${(await msg.guild.members.fetch(recipient)).user.username}`, inline: true })
                .addFields({ name: `Deposit`, value: `+${comma_adder.add(Math.trunc(amount))} credits`, inline: true })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();
            msg.channel.send({ embeds: [deposit_result] });
            return;
        }
        catch (err) {
            console.log(err);
        }
    }
}