// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
}); // firestore credentials

module.exports = {
    name: 'lootbox',
    alias: ['cook', 'lb'],
    description: "rolls for 20000 collectibles",
    category: 'cards',
    admin: false,
    type: "production",
    cooldown: 2,
    async execute(discord_client, msg, args, admin) {

        let lootbox_flips_per_hour_limit = 15;
        let card_cost = 1000;

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let db_user = await require('../utility/queries').user(msg.author.id);
        let lootbox_total_cards = db_user?.lootbox_total_cards ? +db_user.lootbox_total_cards : 0;
        let lootbox_total_cards_limit = db_user?.lootbox_total_cards_limit ? +db_user.lootbox_total_cards_limit : 100; // if not there, 200
        let lootbox_flips_per_hour = db_user?.lootbox_flips_per_hour ? +db_user.lootbox_flips_per_hour : 0;
        let lootbox_flips_timestamp = db_user?.lootbox_flips_timestamp ? +db_user.lootbox_flips_timestamp : 0;

        let current_time_in_seconds = Math.floor(Date.now() / 1000);
        if ((current_time_in_seconds - lootbox_flips_timestamp) >= 3600) {
            lootbox_flips_per_hour = 0;
            lootbox_flips_timestamp = Math.trunc((current_time_in_seconds - (current_time_in_seconds % 3600)));
        }

        if (lootbox_flips_per_hour >= lootbox_flips_per_hour_limit) {
            msg.channel.send(`${msg.author.username} - You've hit your roll limit. Reset -> <t:${lootbox_flips_timestamp+3600}:R> or Reset now -> **+rolls**`);
            return;
        }

        if (lootbox_total_cards >= lootbox_total_cards_limit) {
            msg.channel.send(`${msg.author.username} - You've hit your lootbox card holding limit. To get more -> **+upgrade**`);
            return;
        }

        if (!(await require('../utility/credits').transaction(discord_client, msg, card_cost))) return; // credits manager validates transaction

        let roll_num = Math.floor(Math.random() * 20000) + 1; // [1, 20000]
        try {
            var character = (await db.collection('anime_cards').where(`${msg.guildId}_owned`, "==", false).where("rank", ">=", roll_num).orderBy("rank", "asc").limit(1).get())?._docs()?.[0]?.data(); // retrieve character from database
            if (!character) throw 'no character';
        }
        catch (err) {
            msg.channel.send(`${msg.author.username} - System Error: Anime API Failed`);
            await require('../utility/credits').refund(discord_client, msg.author.id, card_cost); // credits manager refunds on error
            return;
        }

        require('../utility/embeds').print_lootbox(msg, character); // embeds manager prints lootbox card

        try {
            const res = await db.collection('anime_cards').doc(`${roll_num}`).update({ // updates owner_id on roll_num card in database
                [`${msg.guildId}_owner_id`]: msg.author.id.toString(),
                [`${msg.guildId}_owned`]: true,
            });
        }
        catch (err) {
            msg.channel.send(`${msg.author.username} - System Error: Database Failed - Logging Card Changes`);
            await require('../utility/credits').refund(discord_client, msg.author.id, card_cost); // credits manager refunds on error
            return;
        }

        lootbox_total_cards += 1;
        lootbox_flips_per_hour += 1;

        try {
            await db.doc(`members/${msg.author.id}`).set({
                lootbox_total_cards: lootbox_total_cards.toString(),
                lootbox_flips_per_hour: lootbox_flips_per_hour.toString(),
                lootbox_flips_timestamp: lootbox_flips_timestamp.toString(),
            }, { merge: true });
        }
        catch (err) {
            msg.channel.send(`${msg.author.username} - System Error: Database Failed - Logging User Changes`);
            return;
        }
    }
}