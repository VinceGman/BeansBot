const { EmbedBuilder } = require('discord.js');

const wrapText = require("wrap-text");
let textWrap = 31;

const comma_adder = require('commas');

module.exports = {
    name: 'profile',
    alias: ['prof', 'p'],
    description: "set profile",
    category: 'utility',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        if (args.length > 0) {
            if (msg.mentions.users.size > 0) {
                this.display_profile(discord_client, msg, msg.mentions.users.keys().next().value);
                return;
            }


            if (args.length == 1) {
                let profile_guide = new EmbedBuilder()
                    .setTitle(`${wrapText(`Kirby`, textWrap)}`)
                    .setThumbnail('https://pbs.twimg.com/media/DplFZ4QUYAAYiel.jpg')
                    .setColor(`#d44a98`)
                    .setDescription(`It's a watermelon.\n\nThis is how you customize.`)
                    .addFields({ name: 'name', value: `+profile name Kirby`, inline: false })
                    .addFields({ name: 'color', value: `+profile color #d44a98`, inline: false })
                    .addFields({ name: 'image', value: `+profile image https://image-link.jpg`, inline: false })
                    .addFields({ name: 'status', value: `+profile status It's a watermelon.`, inline: false })
                    .addFields({ name: 'clear', value: `+profile name clear`, inline: false })
                    .setFooter({ text: wrapText(`try: +profile`, textWrap) })
                // .setTimestamp();

                msg.channel.send({ embeds: [profile_guide] });
                return;
            }

            // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
            const { Firestore, FieldValue } = require('@google-cloud/firestore');
            const db = new Firestore({
                projectId: 'beans-326017',
                keyFilename: './service-account.json'
            });

            let clear = false;

            let att = args.shift();
            let pref_att, pref_value;
            switch (att.toLowerCase()) {
                case 'name':
                    pref_att = 'pref_name';
                    pref_value = args.join(' ');
                    if (pref_value.toLowerCase() == 'clear') {
                        clear = true;
                    }
                    else if (pref_value.length > 30) {
                        msg.channel.send('The name must be less than 30 characters.');
                        return;
                    }
                    break;
                case 'image':
                    const isImageURL = require('image-url-validator').default;
                    pref_att = 'pref_image';
                    pref_value = args.join(' ');
                    if (pref_value.toLowerCase() == 'clear') {
                        clear = true;
                    }
                    else if (!(await isImageURL(pref_value))) {
                        msg.channel.send('The image must be an image link.');
                        return;
                    }
                    break;
                case 'color':
                    const { validateHTMLColorHex } = require("validate-color");
                    pref_att = 'pref_color';
                    pref_value = args.join(' ');
                    if (pref_value.toLowerCase() == 'clear') {
                        clear = true;
                    }
                    else if (!validateHTMLColorHex(pref_value)) {
                        msg.channel.send('The color must be a hex code.');
                        return;
                    }
                    break;
                case 'status':
                    pref_att = 'pref_status';
                    pref_value = args.join(' ');
                    if (pref_value.toLowerCase() == 'clear') {
                        clear = true;
                    }
                    else if (pref_value.length > 280) {
                        msg.channel.send('The status must be less than 280 characters.');
                        return;
                    }
                    break;
                default:
                    msg.channel.send('The available profile preference changes are: name, image, status and color.');
                    return;
            }
            if (clear) {
                await db.doc(`members/${msg.author.id}`).update({
                    [pref_att]: FieldValue.delete(),
                });
            }
            else {
                await db.doc(`members/${msg.author.id}`).set({
                    [pref_att]: pref_value.toString(),
                }, { merge: true });
            }
        }

        this.display_profile(discord_client, msg, msg.author.id);
        return;
    },
    async display_profile(discord_client, msg, id) {
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        let user = msg.guild.members.cache.find(user => user.id === id);

        let db_user = await require('../utility/queries').user(id);
        let credits = (+db_user.credits);

        let profile_embed = new EmbedBuilder()
            .setTitle(`${wrapText(`${db_user.pref_name ?? user.nickname ?? user.displayName}`, textWrap)}`)
            .setThumbnail(db_user.pref_image ?? user.displayAvatarURL())
            .setColor(db_user.pref_color ?? user.displayHexColor)
            .addFields({ name: 'Currency', value: `${comma_adder.add(Math.trunc(credits))} credits`, inline: false })
            .setFooter({ text: wrapText(`try: +profile settings`, textWrap) })
        // .setTimestamp();

        if (db_user.pref_status != null && db_user.pref_status != '') {
            profile_embed.setDescription(wrapText(db_user.pref_status, textWrap));
        }

        msg.channel.send({ embeds: [profile_embed] });
    }
}