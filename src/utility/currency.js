// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    async transaction(discord_client, msg, cost) {
        if (cost == 0) return true;

        let db_user = await require('./queries').user(msg.author.id);
        let credits = +db_user.credits;

        if (credits < cost) {
            await require('./embeds').notice_embed(discord_client, msg, "Insufficient Funds.", '#fe3939');
            return false;
        }

        credits -= cost;

        await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
            credits: credits.toFixed(2).toString(),
        }, { merge: true });

        return true;
    },
    async refund(discord_client, msg, id, cost) {
        if (cost == 0) return;

        let db_user = await require('./queries').user(id);
        let credits = +db_user.credits;

        credits += cost;

        await db.doc(`servers/${msg.guildId}/members/${id}`).set({
            credits: credits.toFixed(2).toString(),
        }, { merge: true });
    }
}