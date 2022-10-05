module.exports = {
    name: 'income',
    description: "basic uninversal income",
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

        if (!(await require('../utility/timers').timer(msg, this.name, this.cooldown))) return; // timers manager checks cooldown

        let user = await require('../utility/queries').user(msg.author.id);
        let income = user.hasOwnProperty('income') ? +user['income'] : 0;

        let charges = Math.floor(((current_time_in_seconds - income) / 3600));
        let new_cooldown;
        if (charges > 6) {
            charges = 6;
            new_cooldown = current_time_in_seconds;
        }
        else {
            new_cooldown = income + (charges * 3600);
        }

        let booster = msg.member.roles.cache.some(role => role.name === 'Booster') ? 0.25 : 0;
        let patron = msg.member.roles.cache.some(role => role.name === 'Patron') ? 0.25 : 0;

        let amount = charges * 2000;
        let pay = amount + booster * amount + patron * amount;

        msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - You had ${charges}/6 charges saved up. - Credits Earned: ${pay} - Fully Charged: <t:${new_cooldown + (6 * 3600)}:R>`);

        if (charges == 0) return;
        await db.doc(`members/${msg.author.id}`).set({
            credits: (+user['credits'] + pay).toString(),
            income: new_cooldown.toString(),
        }, { merge: true });
    }
}