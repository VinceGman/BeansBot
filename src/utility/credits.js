// give and take credits to a user in the database, validate transactions

module.exports = {
    async transaction(discord_client, msg, cost) {
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        if (cost == 0) return true;

        let db_user = await require('../utility/queries').user(msg.author.id);
        let credits = +db_user.credits;

        if (credits < cost) {
            msg.channel.send(`${msg.author.username} - Insufficient Funds.`);
            return false;
        }

        credits -= cost;

        await db.doc(`members/${msg.author.id}`).set({
            credits: credits.toFixed(2).toString(),
        }, { merge: true });

        let main_bank = await require('../utility/queries').user(discord_client.user.id);
        let main_money = +main_bank.credits;
        main_money += cost;

        await db.doc(`members/${discord_client.user.id}`).set({
            credits: main_money.toFixed(2).toString(),
        }, { merge: true });

        return true;
    },
    async refund(discord_client, id, cost) {
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        if (cost == 0) return;

        let db_user = await require('../utility/queries').user(id);

        let credits = +db_user.credits;
        credits += cost;

        await db.doc(`members/${id}`).set({
            credits: credits.toFixed(2).toString(),
        }, { merge: true });

        let main_bank = await require('../utility/queries').user(discord_client.user.id);
        let main_money = +main_bank.credits;
        main_money -= cost;

        await db.doc(`members/${discord_client.user.id}`).set({
            credits: main_money.toFixed(2).toString(),
        }, { merge: true });
    },
    async income(msg, name, amount, cooldown_in_seconds) {
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        }); // firestore credentials

        let current_time = Math.floor(Date.now() / 1000);
        let user = await require('./queries').user(msg.author.id);

        let credits = +user.credits;
        let last_update = user.hasOwnProperty(name) ? +user[name] : 0;
        if (last_update + cooldown_in_seconds <= current_time) {
            last_update = current_time;

            let booster = msg.member.roles.cache.some(role => role.name === 'Booster') ? 0.25 : 0;
            let patron = msg.member.roles.cache.some(role => role.name === 'Patron') ? 0.25 : 0;

            let pay = amount + booster * amount + patron * amount
            credits += pay;

            await db.doc(`members/${msg.author.id}`).set({
                credits: credits.toString(),
                [name]: last_update.toString(),
            }, { merge: true });

            msg.channel.send(`${msg.author.username} - Credits Earned: ${pay} - ${name.charAt(0).toUpperCase() + name.slice(1)} Cooldown: <t:${last_update + cooldown_in_seconds}:R>`);
        }
        else {
            msg.channel.send(`${msg.author.username} - ${name.charAt(0).toUpperCase() + name.slice(1)} Cooldown: <t:${last_update + cooldown_in_seconds}:R>`);
        }
    }
}