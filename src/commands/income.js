module.exports = {
    name: 'income',
    description: "basic universal income",
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

        let user = await require('../utility/queries').user(msg.author.id);
        let income = user.hasOwnProperty('income') ? +user['income'] : 0;

        let charges = Math.floor(((current_time_in_seconds - income) / 3600));
        let new_cooldown, next_charge;
        if (charges > 6) {
            charges = 6;
            new_cooldown = current_time_in_seconds;
            next_charge = new_cooldown + 3600;
        }
        else {
            new_cooldown = income + (charges * 3600);
            next_charge = income + ((charges + 1) * 3600);
        }

        let booster = msg.member.roles.cache.some(role => role.name.toLowerCase() === 'booster' || role.name.toLowerCase() === 'server booster') ? 0.25 : 0;
        let patron = msg.member.roles.cache.some(role => role.name.toLowerCase() === 'patron') ? 0.25 : 0;

        let main_bank = await require('../utility/queries').user(discord_client.user.id);
        let main_money = main_bank.hasOwnProperty('credits') ? +main_bank['credits'] : 0;

        let amount = charges * main_money * 0.000085;
        let total_amount = amount + booster * amount + patron * amount;

        let pay = +((total_amount * 0.75).toFixed(2));
        let taxes = +((total_amount * 0.25).toFixed(2));

        msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - You had ${charges}/6 charges saved up. - Credits Earned: ${pay} - Taxes Paid: ${taxes} - Next Charge: <t:${next_charge}:R> - Fully Charged: <t:${new_cooldown + (6 * 3600)}:R>`);

        if (charges == 0) return;
        await db.doc(`members/${msg.author.id}`).set({
            credits: (+user['credits'] + pay).toFixed(2).toString(),
            income: new_cooldown.toString(),
        }, { merge: true });
        await db.doc(`members/${discord_client.user.id}`).set({
            credits: (main_money - pay).toFixed(2).toString(),
        }, { merge: true });
    }
}