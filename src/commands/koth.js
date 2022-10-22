const { MessageEmbed } = require('discord.js');
require('dotenv').config(); // .env values

// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'koth',
    description: "king of the hill",
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        if (msg.channel.id != process.env.koth_channel_id) return;

        if (admin && args.length == 1 && args[0].toLowerCase() == 'restart') {
            this.restart(msg);
            return;
        }

        let cooldown_amount = 30;

        let current_time = Math.floor(Date.now() / 1000);
        let next_time = +(await db.doc('values/koth').get())._fieldsProto.lastUpdate.stringValue || 0;

        let next_available = current_time + (cooldown_amount * 60);
        let time_shown = next_time;

        let koth_embed = new MessageEmbed()
            .setTitle(`King Of The Hill`)
            .setDescription(`+koth @person || +koth (text) @person (text)`)
            .setColor(`#880808`)
            .setFooter({ text: `requested by ${msg.author.username}#${msg.author.discriminator}` })
            .setTimestamp();

        if (current_time >= next_time) {
            if (args.length >= 1) {
                let recipient = msg.mentions.members.first();
                if (recipient) {
                    console.log(recipient);
                    if (recipient.roles.cache.some(role => role.name.toLowerCase() === 'king of the hill')) {

                        await db.doc('values/koth').set({
                            lastUpdate: next_available.toString()
                        }, { merge: true }).then((res, rej) => {
                            if (res) {
                                // time_change = true;
                            }
                        });

                        time_shown = next_available;

                        let role = msg.guild.roles.cache.find(role => role.name.toLowerCase() === 'king of the hill');
                        recipient.roles.remove(role);
                        koth_embed.addField(`User Eliminated`, `${recipient.user.username}#${recipient.user.discriminator}`, true);
                    }
                    else {
                        koth_embed.addField(`User N/A`, `The user pinged is already not playing.`, true);
                    }
                }
            }
        }

        koth_embed.addField('Cooldown', `Available <t:${time_shown}:R>.`);
        msg.channel.send({ embeds: [koth_embed] });
    },
    async restart(msg) {
        console.log('restarted');
        let role = msg.guild.roles.cache.find(role => role.name.toLowerCase() === 'king of the hill');
        (await msg.guild.members.fetch()).forEach(member => {
            if (!member.user.bot) {
                member.roles.add(role);
            }
        });

        await db.doc('values/koth').set({
            lastUpdate: '1666324800'
        }, { merge: true }).then((res, rej) => {
            if (res) {
                // time_change = true;
            }
        });

        msg.channel.send('King Of The Hill - Restarted');
    }
}