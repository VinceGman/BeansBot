module.exports = {
    name: 'profile',
    alias: ['p'],
    options: ['i', 'c'],
    description: "shows your money and collectibles",
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
        let credits = db_user.credits;
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
                page.setFooter({ text: wrapText(`BHP Profile${pg}`, textWrap) })
                    .setTimestamp();
                j++;
            });
        }
        else {
            let current_origin = owned[0]._fieldsProto['origin'][owned[0]._fieldsProto['origin'].valueType];
            let count_origin = 1;
            let ownedText = '';
            let i = 0;
            let page = 0;
            do {
                if (options.includes('c')) {
                    if (owned.length == 0) {
                        ownedText = '[none]';
                        pages.push(new MessageEmbed().addField('Currency', `${credits} credits`, false).addField(`Cards Owned`, `${ownedText}`, false));
                    }
                    else {
                        if (count_origin % 5 == 1 && i != 0) {
                            pages.push(new MessageEmbed().addField('Currency', `${credits} credits`, false));
                            page++;
                        }

                        if (current_origin != owned[i]._fieldsProto['origin'][owned[i]._fieldsProto['origin'].valueType] && !owned[i]._fieldsProto['origin'][owned[i]._fieldsProto['origin'].valueType].includes(current_origin)) {
                            pages[page - 1].addField(current_origin, ownedText, false);
                            ownedText = '';
                            current_origin = owned[i]._fieldsProto['origin'][owned[i]._fieldsProto['origin'].valueType];
                            count_origin++;
                        }

                        let lock = owned[i]._fieldsProto['protected'][owned[i]._fieldsProto['protected'].valueType] ? ' - 🔒' : '';
                        let sale = owned[i]._fieldsProto['for_sale'][owned[i]._fieldsProto['for_sale'].valueType] ? ' - ✅' : '';

                        ownedText += `${owned[i]._fieldsProto['name'][owned[i]._fieldsProto['name'].valueType]}${lock}${sale} - #${owned[i]._fieldsProto['rank'][owned[i]._fieldsProto['rank'].valueType]} - ${owned[i]._fieldsProto['stars'][owned[i]._fieldsProto['stars'].valueType]}\n`;
                        if (i == owned.length - 1) {
                            if (count_origin % 5 == 1) {
                                pages.push(new MessageEmbed().addField('Currency', `${credits} credits`, false));
                                page++;
                            }
                            pages[page - 1].addField(current_origin, ownedText, false);
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
                            pages.push(new MessageEmbed().addField('Currency', `${credits} credits`, false).addField(`Cards Owned`, `${ownedText}`, false));
                            page++;
                            ownedText = '';
                        }

                        let lock = owned[i]._fieldsProto['protected'][owned[i]._fieldsProto['protected'].valueType] ? ' - 🔒' : '';
                        let sale = owned[i]._fieldsProto['for_sale'][owned[i]._fieldsProto['for_sale'].valueType] ? ' - ✅' : '';

                        ownedText += `${owned[i]._fieldsProto['name'][owned[i]._fieldsProto['name'].valueType]}${lock}${sale} - #${owned[i]._fieldsProto['rank'][owned[i]._fieldsProto['rank'].valueType]} - ${owned[i]._fieldsProto['stars'][owned[i]._fieldsProto['stars'].valueType]}\n`;
                        if (i == owned.length - 1) {
                            pages.push(new MessageEmbed().addField('Currency', `${credits} credits`, false).addField(`Cards Owned`, `${ownedText}`, false));
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
                    .setFooter({ text: wrapText(`BHP Profile${pg}`, textWrap) })
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