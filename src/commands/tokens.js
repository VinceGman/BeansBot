
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'tokens',
    alias: ['token'],
    alias_show: [],
    description: "tokens information",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        const { EmbedBuilder } = require('discord.js');

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        if (args.length == 0) {
            let user = await require('../utility/queries').user(msg.guildId, msg.author.id);

            let tokens_guide = new EmbedBuilder()
                .setTitle(`Tokens Guide & Dashboard`)
                .setDescription(`You're able to buy Tokens with **Credits** and **USD**.`)
                .setColor('#000000')
                .addFields({ name: '+tokens <number>', value: `Buys Tokens using **Credits** at 10c -> 1t.`, inline: false })
                .addFields({ name: '+tokens 1000', value: `Transfers 1000 Credits to 100 Tokens.`, inline: false })
                .addFields({ name: 'USD', value: 'Ask Sore -> $1:250k | $2:500k | $3:1M | $4:1.5M | $5:2M', inline: false })
                .addFields({ name: '\u200B', value: '\u200B', inline: false })
                .addFields({ name: 'Dashboard', value: `Here's all your token data.`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            if (user.daily_tokens_used) {
                let base_allowance = 2000;
                let booster_bonus = 10000;
                let level_bonus = 100;

                let booster = msg.member.roles.cache.some(role => role.name.toLowerCase().includes('booster')) ? booster_bonus : 0;
                let level = msg.member.roles.cache.some(role => role.name.toLowerCase().includes('level')) ? +msg.member.roles.cache.find(role => role.name.toLowerCase().includes('level')).name.toLowerCase().replace('level ', '') * level_bonus : 0;

                let daily_token_limit = base_allowance + booster + level;

                tokens_guide.addFields({ name: `Token Limit`, value: `${user.daily_tokens_used}/${daily_token_limit}`, inline: true });
            }
            if (user.daily_token_reset) {
                let time_left = 'Available';
                if ((+user.daily_token_reset + 86400) > (Math.floor(Date.now() / 1000))) {
                    time_left = `<t:${+user.daily_token_reset + 86400}:R>`;
                }
                tokens_guide.addFields({ name: 'Next Reset', value: time_left, inline: true });
            }
            if (user.extra_token_pool) {
                tokens_guide.addFields({ name: 'Extra Token Pool', value: `${user.extra_token_pool}`, inline: false });
            }

            msg.channel.send({ embeds: [tokens_guide] });
            return;
        }
        else if (args.length == 1) {
            if (isNaN(args[0])) {
                await msg.reply(`You must input a number. See -> **+tokens**`);
                return;
            }
            if (+args[0] < 1000) {
                msg.channel.send(`${msg.author.username} - Your number must be greater than 1000.`);
                return;
            }
            if (args[0].includes('.')) {
                msg.channel.send(`${msg.author.username} - Your number must be whole.`);
                return;
            }

            if (!(await require('../utility/credits').transaction(discord_client, msg, +args[0]))) return; // credits manager validates transaction

            let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
            let extra_token_pool = db_user?.extra_token_pool ? +db_user.extra_token_pool : 0;

            extra_token_pool += Math.floor(+args[0] / 10);

            await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
                extra_token_pool: extra_token_pool.toString()
            }, { merge: true });
        }
        else {
            await msg.reply(`Wrong number of arguments. See -> **+tokens**`);
            return;
        }
    }
}