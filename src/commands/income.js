module.exports = {
    name: 'income',
    description: "basic universal income",
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
        let income = user.hasOwnProperty('income') ? +user['income'] : 0;
        let income_max_charges = user.hasOwnProperty('income_max_charges') ? +user['income_max_charges'] : 6;
        const user_bonus = user.hasOwnProperty('bonus') ? user['bonus'] : { lastUsedMonth: -1, lastUsedYear: -1, method: '' };

        let charges = Math.floor(((current_time_in_seconds - income) / 3600));
        let new_cooldown, next_charge;
        if (charges >= income_max_charges) {
            charges = income_max_charges;
            new_cooldown = current_time_in_seconds;
            next_charge = new_cooldown + 3600;
        }
        else {
            new_cooldown = income + (charges * 3600);
            next_charge = income + ((charges + 1) * 3600);
        }

        const today = new Date();
        let bonus = user_bonus.method == 'raise' && user_bonus.lastUsedMonth == today.getMonth() && user_bonus.lastUsedYear == today.getFullYear() ? 2500 : 0;
        let booster = msg.member.roles.cache.some(role => role.name.toLowerCase().includes('booster')) ? 1.25 : 1;

        let amount = charges * 2000 + charges * bonus;
        let total_amount = amount * booster;

        let pay = +(total_amount.toFixed(2));

        await this.income_embed(msg, charges, pay, next_charge, new_cooldown, bonus, booster);

        if (charges == 0) return;
        await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
            credits: (+user['credits'] + pay).toFixed(2).toString(),
            income: new_cooldown.toString(),
        }, { merge: true });
    },
    async income_embed(msg, charges, pay, next_charge, new_cooldown, bonus, booster) {
        const comma_adder = require('commas');
        let color = '#607d8b';
        let booster_income = '';

        let bonus_raise = '';
        if (bonus) {
            bonus_raise = ' + Raise';
        }

        let fields = [];
        // if (charges != 0) {
        //     fields.push({ name: 'Charges', value: `${charges}`, inline: false });
        // }
        if (pay != 0) {
            fields.push({ name: `Paid${bonus_raise}`, value: `${comma_adder.add(Math.trunc(pay))} credits`, inline: false });
        }

        if (booster > 1) {
            color = '#f47fff';
            booster_income = 'Booster ';
        }

        const { EmbedBuilder } = require('discord.js');
        let embed = new EmbedBuilder()
            .setTitle(`${booster_income}Income`)
            .setColor(color)
            .addFields([
                ...fields,
                {
                    name: 'Payment Available',
                    value: `<t:${next_charge}:R>`,
                    inline: false,
                }
            ])
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [embed] });
    }
}