module.exports = {
    name: 'profile',
    alias: ['prof', 'p'],
    description: "shows your money and collectibles",
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        if (!(await require('../utility/timers').timer(msg, this.name, this.cooldown))) return; // timers manager checks cooldown

        if (args.length > 0) {
            if (msg.mentions.users.size > 0) {
                this.display_profile(discord_client, msg, msg.mentions.users.keys().next().value);
                return;
            }

            if (args.length == 1) {
                msg.channel.send("+profile (name | color | image | status) (content) -> +profile name Bean's Lovely Waifus")
                return;
            }

            // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
            const { Firestore } = require('@google-cloud/firestore');
            const db = new Firestore({
                projectId: 'beans-326017',
                keyFilename: './service-account.json'
            });

            let att = args.shift();
            let pref_att, pref_value;
            switch (att) {
                case 'name':
                    pref_att = 'pref_name';
                    pref_value = args.join(' ');
                    if (pref_value.length > 30) {
                        msg.channel.send('The name must be less than 30 characters.');
                        return;
                    }
                    msg.channel.send('Name Changed');
                    break;
                case 'image':
                    const isImageURL = require('image-url-validator').default;
                    pref_att = 'pref_image';
                    pref_value = args.join(' ');
                    if (!(await isImageURL(pref_value))) {
                        msg.channel.send('The image must be an image link.');
                        return;
                    }
                    msg.channel.send('Image Changed');
                    break;
                case 'color':
                    const { validateHTMLColorHex } = require("validate-color");
                    pref_att = 'pref_color';
                    pref_value = args.join(' ');
                    if (!validateHTMLColorHex(pref_value)) {
                        msg.channel.send('The color must be a hex code.');
                        return;
                    }
                    msg.channel.send('Color Changed');
                    break;
                case 'status':
                    pref_att = 'pref_status';
                    pref_value = args.join(' ');
                    if (pref_value.length > 280) {
                        msg.channel.send('The status must be less than 280 characters.');
                        return;
                    }
                    msg.channel.send('Status Changed');
                    break;
                default:
                    msg.channel.send('The available profile preference changes are: name, image, status and color.');
                    return;
            }
            await db.doc(`members/${msg.author.id}`).set({
                [pref_att]: pref_value.toString(),
            }, { merge: true });
        }
        else {
            this.display_profile(discord_client, msg, msg.author.id);
            return;
        }
    },
    async display_profile(discord_client, msg, id) {
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        const { MessageEmbed } = require('discord.js');

        const wrapText = require("wrap-text");
        let textWrap = 31;

        let user = discord_client.users.cache.find(user => user.id === id);

        let db_user = await require('../utility/queries').user(id);
        let credits = db_user.credits;
        let owned = (await db.collection('edition_one').where('owner_id', '==', id).orderBy("rank", "asc").get())._docs();

        let ownedText = '';
        let i = 0;
        while (ownedText.length <= 850 && i < owned.length) {
            let lock = owned[i]._fieldsProto['protected'][owned[i]._fieldsProto['protected'].valueType] ? ' - 🔒' : '';
            let sale = owned[i]._fieldsProto['for_sale'][owned[i]._fieldsProto['for_sale'].valueType] ? ' - ✅' : '';

            ownedText += `${owned[i]._fieldsProto['name'][owned[i]._fieldsProto['name'].valueType]}${lock}${sale} - #${owned[i]._fieldsProto['rank'][owned[i]._fieldsProto['rank'].valueType]} - ${owned[i]._fieldsProto['stars'][owned[i]._fieldsProto['stars'].valueType]}\n`;
            i++;
        }

        ownedText = ownedText == '' ? '[none]' : ownedText;

        let profile_embed = new MessageEmbed()
            .setTitle(`${wrapText(db_user.pref_name ?? user.username, textWrap)}`)
            .addField('Currency', `${credits} credits`, false)
            .addField('Cards Owned', `${ownedText}`, false)
            .setThumbnail(db_user.pref_image ?? user.avatarURL())
            .setColor(db_user.pref_color ?? `#ADD8E6`)
            .setFooter({ text: wrapText(`BHP Profile`, textWrap) })
            .setTimestamp();

        if (db_user.pref_status != null && db_user.pref_status != '') {
            profile_embed.setDescription(db_user.pref_status)
        }

        msg.channel.send({ embeds: [profile_embed] });
    }
}