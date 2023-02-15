module.exports = {
    name: 'profile',
    alias: ['p'],
    options: ['i', 'c'],
    description: "shows your money and collectibles",
    category: 'collectibles',
    admin: false,
    type: "production",
    cooldown: 10,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown
        let options = require('../utility/parsers').parse_command(msg, this.name, this.alias);

        if (args.length > 0) {
            if (msg.mentions.users.size > 0) {
                this.display_profile(discord_client, msg, msg.mentions.users.keys().next().value, options);
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
            this.display_profile(discord_client, msg, msg.author.id, options);
            return;
        }
    },
    async display_profile(discord_client, msg, id, options) {
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
        let credits = (+db_user.credits).toFixed(0);
        let owned = (await db.collection('edition_one').where('owner_id', '==', id).orderBy("rank", "asc").get())._docs();

        if (options.includes('c')) {
            owned = owned.sort((a, b) => {
                return (a._fieldsProto.origin.stringValue < b._fieldsProto.origin.stringValue) ? -1 : (a._fieldsProto.origin.stringValue > b._fieldsProto.origin.stringValue) ? 1 : 0;
            });
        }

        let pages = [];
        if (options.includes('i')) {
            for (let character of owned) {
                character = character._fieldsProto;
                pages.push(await require('../utility/embeds').make_card_embed(discord_client, msg, character))
            }
            if (owned.length == 0) {
                ownedText = '[none]';
                pages.push(new MessageEmbed().addField('Currency', `${credits} credits`, false)
                    .addField(`Cards Owned`, `${ownedText}`, false)
                    .setTitle(`${wrapText(db_user.pref_name ?? user.username, textWrap)}`)
                    .setThumbnail(db_user.pref_image ?? user.avatarURL())
                    .setColor(db_user.pref_color ?? `#ADD8E6`));
            }
            let pg = '';
            let j = 1;
            pages.forEach(page => {
                if (pages.length == 1) {
                    pg = '';
                }
                else {
                    pg = ` - p.${j}`;
                }
                page.setFooter({ text: wrapText(`Beans Profile${pg}`, textWrap) })
                    .setTimestamp();
                j++;
            });
        }
        else {
            try {
                var current_origin = owned[0]._fieldsProto['origin'][owned[0]._fieldsProto['origin'].valueType];
            }
            catch (err) {
                var current_origin = '???@<>';
            }
            let ownedText = '';
            let i = 0;
            let fields = [];
            let page = 0;
            let account_value = 0;
            do {
                if (options.includes('c')) {
                    if (owned.length == 0) {
                        ownedText = '[none]';
                        pages.push(new MessageEmbed().addField('Currency', `${credits} credits`, false).addField(`Cards Owned`, `${ownedText}`, false));
                    }
                    else {
                        if (current_origin != owned[i]._fieldsProto['origin'][owned[i]._fieldsProto['origin'].valueType] && !owned[i]._fieldsProto['origin'][owned[i]._fieldsProto['origin'].valueType].includes(current_origin)) {
                            fields.push({ current_origin: current_origin, ownedText: ownedText });
                            ownedText = '';
                            current_origin = owned[i]._fieldsProto['origin'][owned[i]._fieldsProto['origin'].valueType];
                        }

                        let lock = owned[i]._fieldsProto['protected'][owned[i]._fieldsProto['protected'].valueType] ? ' - 🔒' : '';
                        let sale = owned[i]._fieldsProto['for_sale'][owned[i]._fieldsProto['for_sale'].valueType] ? ' - ✅' : '';

                        ownedText += `${owned[i]._fieldsProto['name'][owned[i]._fieldsProto['name'].valueType]}${lock}${sale} - #${owned[i]._fieldsProto['rank'][owned[i]._fieldsProto['rank'].valueType]} - ${owned[i]._fieldsProto['stars'][owned[i]._fieldsProto['stars'].valueType]}\n`;

                        let value = 0;
                        switch (owned[i]._fieldsProto['rarity'][owned[i]._fieldsProto['rarity'].valueType]) {
                            case 'Common':
                                value = 250;
                                break;
                            case 'Uncommon':
                                value = 500;
                                break;
                            case 'Rare':
                                value = 2500;
                                break;
                            case 'Epic':
                                value = 5000;
                                break;
                            case 'Legendary':
                                value = 15000;
                                break;
                            case 'Ultimate':
                                value = 25000;
                                break;
                            default:
                                value = 0;
                        }

                        account_value += value;

                        if (i == owned.length - 1) {
                            fields.push({ current_origin: current_origin, ownedText: ownedText });
                            for (let i = 0; i < fields.length; i++) {
                                if (i % 5 == 0) {
                                    pages.push(new MessageEmbed().addField('Currency', `${credits} credits`, true).addField('Cards Value', `${account_value} credits`, true));
                                    page++;
                                }
                                pages[page-1].addField(fields[i].current_origin, fields[i].ownedText, false);
                            }
                        }

                        i++;
                    }
                }
                else {
                    if (owned.length == 0) {
                        ownedText = '[none]';
                        pages.push(new MessageEmbed().addField('Currency', `${credits} credits`, false).addField(`Cards Owned`, `${ownedText}`, false));
                    }
                    else {
                        if (ownedText.length >= 600) {
                            fields.push({ ownedText: ownedText });
                            ownedText = '';
                        }

                        let lock = owned[i]._fieldsProto['protected'][owned[i]._fieldsProto['protected'].valueType] ? ' - 🔒' : '';
                        let sale = owned[i]._fieldsProto['for_sale'][owned[i]._fieldsProto['for_sale'].valueType] ? ' - ✅' : '';

                        ownedText += `${owned[i]._fieldsProto['name'][owned[i]._fieldsProto['name'].valueType]}${lock}${sale} - #${owned[i]._fieldsProto['rank'][owned[i]._fieldsProto['rank'].valueType]} - ${owned[i]._fieldsProto['stars'][owned[i]._fieldsProto['stars'].valueType]}\n`;

                        let value = 0;
                        switch (owned[i]._fieldsProto['rarity'][owned[i]._fieldsProto['rarity'].valueType]) {
                            case 'Common':
                                value = 250;
                                break;
                            case 'Uncommon':
                                value = 500;
                                break;
                            case 'Rare':
                                value = 2500;
                                break;
                            case 'Epic':
                                value = 5000;
                                break;
                            case 'Legendary':
                                value = 15000;
                                break;
                            case 'Ultimate':
                                value = 25000;
                                break;
                            default:
                                value = 0;
                        }

                        account_value += value;

                        if (i == owned.length - 1) {
                            fields.push({ ownedText: ownedText });
                            for (let i = 0; i < fields.length; i++) {
                                pages.push(new MessageEmbed().addField('Currency', `${credits} credits`, true).addField('Cards Value', `${account_value} credits`, true).addField('Cards Owned', `${fields[i].ownedText}`, false));
                            }
                        }
                        i++;
                    }
                }
            } while (i < owned.length);

            let pg = '';
            let j = 1;
            pages.forEach(page => {
                if (pages.length == 1) {
                    pg = '';
                }
                else {
                    pg = ` - p.${j}`;
                }
                page.setTitle(`${wrapText(`${db_user.pref_name ?? user.username}`, textWrap)}`)
                    .setThumbnail(db_user.pref_image ?? user.avatarURL())
                    .setColor(db_user.pref_color ?? `#ADD8E6`)
                    .setFooter({ text: wrapText(`Beans Profile${pg}`, textWrap) })
                    .setTimestamp();

                if (db_user.pref_status != null && db_user.pref_status != '') {
                    page.setDescription(db_user.pref_status)
                }
                j++;
            });
        }

        await require('../utility/pagination').paginationEmbed(msg, pages);
    }
}