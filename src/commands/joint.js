// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

module.exports = {
    name: 'joint',
    alias: ['join'],
    description: "add someone to your joint account",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        try {
            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            let { recipient } = await require('../utility/parsers').parse_user(msg, args);

            let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
            let joint = db_user?.joint ? db_user.joint : { credits: '0', users: [] };

            if (!recipient) {
                let discord_users = await msg.guild.members.fetch();
                let joint_users = joint.users.map(u => discord_users.has(u) ? discord_users.get(u).user.username : '').filter(Boolean).join('\n') || '[none]';
                let foreign_accounts = (await db.collection(`servers/${msg.guildId}/members`).where('joint.users', 'array-contains', msg.author.id).get()).docs.map(m => m.id);
                let joint_accounts = foreign_accounts.map(u => discord_users.has(u) ? discord_users.get(u).user.username : '').filter(Boolean).join('\n') || '[none]';

                let { personalized_embed: joint_embed } = await require('../utility/embeds').personalized_embed(msg, msg.author.id, db_user, discord_users.get(msg.author.id));

                joint_embed
                    .addFields({ name: `Joint`, value: `${comma_adder.add(Math.trunc(joint.credits))} credits`, inline: false })

                if (joint_users == '[none]') {
                    joint_embed.addFields({ name: `Access`, value: `Use **+joint @user** to give and remove access.`, inline: false })
                }

                joint_embed
                    .addFields({ name: `Access To:`, value: `${joint_users}`, inline: true })
                    .addFields({ name: `Access From:`, value: `${joint_accounts}`, inline: true })
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();
                msg.channel.send({ embeds: [joint_embed] });
                return;
            }

            let needs_removing = joint.users.includes(recipient);
            if (needs_removing) {
                joint.users = joint.users.filter(u => u !== recipient);
            } else {
                joint.users.push(recipient);
            }

            await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
                joint: joint,
            }, { merge: true });

            let discord_users = await msg.guild.members.fetch();
            let joint_users = joint.users.map(u => discord_users.has(u) ? discord_users.get(u).user.username : '').filter(Boolean).join('\n') || '[none]';
            let foreign_accounts = (await db.collection(`servers/${msg.guildId}/members`).where('joint.users', 'array-contains', msg.author.id).get()).docs.map(m => m.id);
            let joint_accounts = foreign_accounts.map(u => discord_users.has(u) ? discord_users.get(u).user.username : '').filter(Boolean).join('\n') || '[none]';

            let { personalized_embed: joint_embed } = await require('../utility/embeds').personalized_embed(msg, msg.author.id, db_user, discord_users.get(msg.author.id));

            joint_embed
                .addFields({ name: `Joint`, value: `${comma_adder.add(Math.trunc(joint.credits))} credits`, inline: false })
                .addFields({ name: `${needs_removing ? 'Removed' : 'Added'}`, value: `${discord_users.get(recipient).user.username}`, inline: false })
                .addFields({ name: `Access To:`, value: `${joint_users}`, inline: true })
                .addFields({ name: `Access From:`, value: `${joint_accounts}`, inline: true })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();
            msg.channel.send({ embeds: [joint_embed] });
            return;
        }
        catch (err) {
            console.log(err);
        }
    }
}