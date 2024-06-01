module.exports = {
    name: 'stimulus',
    description: "stimulus on the first of the month",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        let current_time_in_seconds = Math.floor(Date.now() / 1000);

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let user = await require('../utility/queries').user(msg.guildId, msg.author.id);
        let stimulus = user.hasOwnProperty('stimulus') ? +user['stimulus'] : 0;

        let amount = 0;
        if (current_time_in_seconds - stimulus >= 2419200 && (new Date()).getDate() == 1) {
            amount = 1200000;
            stimulus = current_time_in_seconds;
        }

        let booster = msg.member.roles.cache.some(role => role.name.toLowerCase().includes('booster')) ? 0.25 : 0;

        let total_amount = amount + booster * amount;

        let pay = +(total_amount.toFixed(2));

        await this.stimulus_embed(msg, pay, stimulus, booster);

        if (pay == 0) return;
        await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
            credits: (+user['credits'] + pay).toFixed(2).toString(),
            stimulus: stimulus.toString(),
        }, { merge: true });
    },
    async stimulus_embed(msg, pay, stimulus, booster) {
        const comma_adder = require('commas');
        let color = '#607d8b';
        let booster_stimulus = '';
        let fields = [];
        if (pay != 0) {
            fields.push({ name: 'Paid', value: `${comma_adder.add(Math.trunc(pay))} credits`, inline: false });
        }

        if (booster) {
            color = '#f47fff';
            booster_stimulus = 'Booster ';
        }

        const { EmbedBuilder } = require('discord.js');
        let embed = new EmbedBuilder()
            .setTitle(`${booster_stimulus}Stimulus`)
            .setColor(color)
            .addFields([
                ...fields,
                {
                    name: 'Payment Available',
                    value: `1st of Next Month`,
                    inline: false,
                }
            ])
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [embed] });
    }
}