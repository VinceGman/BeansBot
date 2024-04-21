// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    async update_user_card_count(msg, id, count_change_num) {
        if (count_change_num == 0) return;

        let db_user = await require('./queries').user(msg.guildId, id);
        let lootbox_total_cards = db_user?.lootbox_total_cards ? +db_user.lootbox_total_cards : 0;
        lootbox_total_cards = (lootbox_total_cards + count_change_num) <= 0 ? 0 : (lootbox_total_cards + count_change_num);

        await db.doc(`servers/${msg.guildId}/members/${id}`).set({
            lootbox_total_cards: lootbox_total_cards.toString(),
        }, { merge: true });
    }

}
