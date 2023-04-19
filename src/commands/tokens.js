
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'tokens',
    alias: ['token'],
    description: "tokens information",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        if (args.length == 0) {
            let user = await require('../utility/queries').user(msg.author.id);

            let tokens_guide = new MessageEmbed()
                .setTitle(`Tokens Guide & Dashboard`)
                .setDescription(`You're able to buy Tokens with **Credits** and **USD**.`)
                .setColor('#000000')
                .addField('+tokens <number>', `Buys Tokens using **Credits** at 10c -> 1t.`, false)
                .addField('+tokens 1000', `Transfers 1000 Credits to 100 Tokens.`, false)
                .addField('USD', 'Ask Sore -> $1:250k | $2:500k | $3:1M | $4:1.5M | $5:2M')
                .addField('\u200B', '\u200B', false)
                .addField('Dashboard', `Here's all your token data.`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            if (user.daily_tokens_used) {
                let base_allowance = 2000;
                let booster_bonus = 10000;
                let level_bonus = 100;

                let booster = msg.member.roles.cache.some(role => role.name.toLowerCase().includes('booster')) ? booster_bonus : 0;
                let level = msg.member.roles.cache.some(role => role.name.toLowerCase().includes('level')) ? +msg.member.roles.cache.find(role => role.name.toLowerCase().includes('level')).name.toLowerCase().replace('level ', '') * level_bonus : 0;

                let daily_token_limit = base_allowance + booster + level;

                tokens_guide.addField(`Token Limit`, `${user.daily_tokens_used}/${daily_token_limit}`, true);
            }
            if (user.daily_token_reset) {
                let time_left = 'Available';
                if ((+user.daily_token_reset + 86400) > (Math.floor(Date.now() / 1000))) {
                    time_left = `<t:${+user.daily_token_reset + 86400}:R>`;
                }
                tokens_guide.addField('Next Reset', time_left, true);
            }
            if (user.extra_token_pool) {
                tokens_guide.addField('Extra Token Pool', `${user.extra_token_pool}`, false);
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
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Your number must be greater than 1000.`);
                return;
            }
            if (args[0].includes('.')) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Your number must be whole.`);
                return;
            }

            if (!(await require('../utility/credits').transaction(discord_client, msg, +args[0]))) return; // credits manager validates transaction

            let db_user = await require('../utility/queries').user(msg.author.id);
            let extra_token_pool = db_user?.extra_token_pool ? +db_user.extra_token_pool : 0;

            extra_token_pool += Math.floor(+args[0] / 10);

            await db.doc(`members/${msg.author.id}`).set({
                extra_token_pool: extra_token_pool.toString()
            }, { merge: true });
        }
        else {
            await msg.reply(`Wrong number of arguments. See -> **+tokens**`);
            return;
        }
    }
}