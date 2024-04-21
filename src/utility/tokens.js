// give and take credits to a user in the database, validate transactions

let base_allowance = 2000;
let booster_bonus = 10000;
let level_bonus = 100;

module.exports = {
    async verify_tokens(discord_client, msg) {
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        let current_time_in_seconds = Math.floor(Date.now() / 1000);
        let seconds_in_a_day = 86400;

        let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
        let daily_tokens_used = db_user?.daily_tokens_used ? +db_user.daily_tokens_used : 0;
        let daily_token_reset = db_user?.daily_token_reset ? +db_user.daily_token_reset : 0;
        let extra_token_pool = db_user?.extra_token_pool ? +db_user.extra_token_pool : 0;
        let all_time_tokens_used = db_user?.all_time_tokens_used ? +db_user.all_time_tokens_used : 0;

        if (daily_token_reset + seconds_in_a_day <= current_time_in_seconds) {

            await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
                all_time_tokens_used: (all_time_tokens_used + daily_tokens_used).toString(),
                daily_tokens_used: '0',
                daily_token_reset: current_time_in_seconds.toString(),
            }, { merge: true });

            return true;
        }

        let booster = msg.member.roles.cache.some(role => role.name.toLowerCase().includes('booster')) ? booster_bonus : 0;
        let level = msg.member.roles.cache.some(role => role.name.toLowerCase().includes('level')) ? +msg.member.roles.cache.find(role => role.name.toLowerCase().includes('level')).name.toLowerCase().replace('level ', '') * level_bonus : 0;

        let daily_token_limit = base_allowance + booster + level;

        if (daily_tokens_used < daily_token_limit || extra_token_pool > 0) {

            if (extra_token_pool <= -20000) {
                await msg.reply(`You've overdrafted too many tokens. See -> **+tokens**`);
                return false;
            }

            return true;
        }

        await msg.reply(`You've used all your daily tokens. See -> **+tokens**`);
        return false;
    },
    async transaction(discord_client, msg, cost) {
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
        let daily_tokens_used = db_user?.daily_tokens_used ? +db_user.daily_tokens_used : 0;
        let extra_token_pool = db_user?.extra_token_pool ? +db_user.extra_token_pool : 0;
        let all_time_tokens_used = db_user?.all_time_tokens_used ? +db_user.all_time_tokens_used : 0;

        let booster = msg.member.roles.cache.some(role => role.name.toLowerCase().includes('booster')) ? booster_bonus : 0;
        let level = msg.member.roles.cache.some(role => role.name.toLowerCase().includes('level')) ? +msg.member.roles.cache.find(role => role.name.toLowerCase().includes('level')).name.toLowerCase().replace('level ', '') * level_bonus : 0;

        let daily_token_limit = base_allowance + booster + level;

        if (cost + daily_tokens_used > daily_token_limit) {
            extra_token_pool -= (cost + daily_tokens_used) - daily_token_limit;
            all_time_tokens_used += (cost + daily_tokens_used) - daily_token_limit;
            daily_tokens_used = daily_token_limit;
        }
        else {
            daily_tokens_used += cost;
        }

        await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
            all_time_tokens_used: all_time_tokens_used.toString(),
            daily_tokens_used: daily_tokens_used.toString(),
            extra_token_pool: extra_token_pool.toString()
        }, { merge: true });
    }
}