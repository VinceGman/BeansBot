
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'leaderboard',
    alias: ['top'],
    description: "see the top credits",
    category: 'utility',
    admin: false,
    type: "test",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        try {
            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            let leaderboard_embed = new EmbedBuilder()
                .setTitle('Credits Leaderboard')
                .setColor('#907aa8')
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            let discord_users_ids = [...(await msg.guild.members.fetch()).keys()];

            let map_users_ids_credits = new Map();
            ((await db.collection(`members`).get())._docs()).forEach((doc) => {
                map_users_ids_credits.set(doc._ref._path.segments[1], doc.data().credits ?? '0');
            });

            let users_credits = [];
            for (let user_id of discord_users_ids) {
                if (map_users_ids_credits.get(user_id)) users_credits.push({ id: user_id, credits: +map_users_ids_credits.get(user_id) })
            }

            users_credits.sort((a, b) => { return b.credits - a.credits });
            users_credits.shift();
            users_credits = users_credits.slice(0, 10);

            for (let user of users_credits) {
                let discord_user = await msg.guild.members.fetch(user.id);
                leaderboard_embed.addFields({ name: discord_user.nickname ?? discord_user.user.username, value: `${user.credits}`, inline: false });
            }

            msg.channel.send({ embeds: [leaderboard_embed] });

        }
        catch (err) {
            msg.channel.send('Fetching the leaderboard did not work.');
        }
    }
}