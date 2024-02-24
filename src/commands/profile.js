// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

const wrapText = require("wrap-text");
let textWrap = 2000;

module.exports = {
    name: 'profile',
    alias: ['p'],
    options: ['i', 'c'],
    description: "set profile",
    category: 'utility',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown
        let options = require('../utility/parsers').parse_command(msg, this.name, this.alias);

        if (args.length > 0) {
            if (msg.mentions.users.size > 0) {
                this.display_profile_full(discord_client, msg, msg.mentions.users.keys().next().value, options);
                return;
            }


            if (args.length == 1 && args[0].toLowerCase() == 'settings') {
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
                    .setFooter({ text: wrapText(`+profile settings`, textWrap) })
                    .setTimestamp();

                msg.channel.send({ embeds: [profile_guide] });
                return;
            }

            let clear = false;

            let att = args.shift();
            let pref_att, pref_value;
            switch (att.toLowerCase()) {
                case 'name': case 'name:':
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
                case 'image': case 'image:':
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
                case 'color': case 'color:':
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
                case 'status': case 'status:':
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

        this.display_profile_full(discord_client, msg, msg.author.id, options);
        return;
    },
    async display_profile(discord_client, msg, id, options) {
        let user = msg.guild.members.cache.find(user => user.id === id);

        let db_user = await require('../utility/queries').user(id);
        let credits = (+db_user.credits);

        let profile_embed = new EmbedBuilder()
            .setTitle(`${wrapText(`${db_user.pref_name ?? user.nickname ?? user.displayName}`, textWrap)}`)
            .setThumbnail(db_user.pref_image ?? user.displayAvatarURL())
            .setColor(db_user.pref_color ?? user.displayHexColor)
            .addFields({ name: 'Currency', value: `${comma_adder.add(Math.trunc(credits))} credits`, inline: false })
            .setFooter({ text: wrapText(`+profile settings`, textWrap) })
            .setTimestamp();

        if (db_user.pref_status != null && db_user.pref_status != '') {
            profile_embed.setDescription(wrapText(db_user.pref_status, textWrap));
        }

        msg.channel.send({ embeds: [profile_embed] });
    },
    async display_profile_full(discord_client, msg, id, options) {
        const wrapText = require("wrap-text");
        let textWrap = 31;

        let user = await msg.guild.members.fetch(id);

        let db_user = await require('../utility/queries').user(id);
        let credits = +db_user.credits;
        let lootbox_total_cards = db_user?.lootbox_total_cards ? +db_user.lootbox_total_cards : 0;
        let lootbox_total_cards_limit = db_user?.lootbox_total_cards_limit ? +db_user.lootbox_total_cards_limit : 100; // if not there, 200

        let owned = (await db.collection('anime_cards').where(`${msg.guildId}_owner_id`, '==', id).orderBy("rank", "asc").get())._docs();

        if (options.includes('c')) {
            owned = owned.sort((a, b) => {
                return (a._fieldsProto.origin.stringValue < b._fieldsProto.origin.stringValue) ? -1 : (a._fieldsProto.origin.stringValue > b._fieldsProto.origin.stringValue) ? 1 : 0;
            });
        }

        let pages = [];
        if (options.includes('i')) {
            for (let character of owned) {
                character = character.data();
                pages.push(await require('../utility/embeds').make_card_embed(discord_client, msg, character, true))
            }
            if (owned.length == 0) {
                ownedText = '[none]';
                let profile_embed = new EmbedBuilder()
                    .addFields({ name: 'Currency', value: `${comma_adder.add(Math.trunc(credits))} credits`, inline: false })
                    .setTitle(`${wrapText(`${db_user.pref_name ?? user.nickname ?? user.displayName}`, textWrap)}`)
                    .setThumbnail(db_user.pref_image ?? user.displayAvatarURL())
                    .setColor(db_user.pref_color ?? user.displayHexColor);

                if (db_user.pref_status != null && db_user.pref_status != '') {
                    profile_embed.setDescription(wrapText(db_user.pref_status, textWrap));
                }

                pages.push(profile_embed);
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
                page.setFooter({ text: wrapText(`profile${pg}`, textWrap) })
                    .setTimestamp();
                j++;
            });
        }
        // else if (options.includes('s')) {
        //     try {
        //         var current_origin = owned[0]._fieldsProto['origin'][owned[0]._fieldsProto['origin'].valueType];
        //     }
        //     catch (err) {
        //         var current_origin = '???@<>';
        //     }
        //     let ownedText = '';
        //     let i = 0;
        //     let fields = [];
        //     let page = 0;
        //     let account_value = 0;
        //     do {
        //         if (options.includes('c')) {
        //             if (owned.length == 0) {
        //                 ownedText = '[none]';
        //                 pages.push(new EmbedBuilder().addFields({ name: 'Currency', value: `${comma_adder.add(Math.trunc(credits))} credits`, inline: false }).addFields({ name: `Cards Owned`, value: `${ownedText}`, inline: false }));
        //             }
        //             else {
        //                 if (current_origin != owned[i]._fieldsProto['origin'][owned[i]._fieldsProto['origin'].valueType] && !owned[i]._fieldsProto['origin'][owned[i]._fieldsProto['origin'].valueType].includes(current_origin)) {
        //                     fields.push({ current_origin: current_origin, ownedText: ownedText });
        //                     ownedText = '';
        //                     current_origin = owned[i]._fieldsProto['origin'][owned[i]._fieldsProto['origin'].valueType];
        //                 }

        //                 let lock = owned[i]._fieldsProto[`${msg.guildId}_protected`][owned[i]._fieldsProto[`${msg.guildId}_protected`].valueType] ? ' - 🛡️' : '';
        //                 // let sale = owned[i]._fieldsProto['for_sale'][owned[i]._fieldsProto['for_sale'].valueType] ? ' - ✅' : '';

        //                 ownedText += `${owned[i]._fieldsProto['name'][owned[i]._fieldsProto['name'].valueType]}${lock} - #${owned[i]._fieldsProto['rank'][owned[i]._fieldsProto['rank'].valueType]} - ${owned[i]._fieldsProto['stars'][owned[i]._fieldsProto['stars'].valueType]}\n`;

        //                 let value = 0;
        //                 switch (owned[i]._fieldsProto['rarity'][owned[i]._fieldsProto['rarity'].valueType]) {
        //                     case 'Common':
        //                         value = 250;
        //                         break;
        //                     case 'Uncommon':
        //                         value = 500;
        //                         break;
        //                     case 'Rare':
        //                         value = 2500;
        //                         break;
        //                     case 'Epic':
        //                         value = 5000;
        //                         break;
        //                     case 'Legendary':
        //                         value = 15000;
        //                         break;
        //                     case 'Ultimate':
        //                         value = 25000;
        //                         break;
        //                     default:
        //                         value = 0;
        //                 }

        //                 account_value += value;

        //                 if (i == owned.length - 1) {
        //                     fields.push({ current_origin: current_origin, ownedText: ownedText });
        //                     for (let i = 0; i < fields.length; i++) {
        //                         if (i % 5 == 0) {
        //                             pages.push(new EmbedBuilder().addFields({ name: 'Currency', value: `${comma_adder.add(Math.trunc(credits))} credits`, inline: true }).addFields({ name: 'Card Count', value: `${lootbox_total_cards}/${lootbox_total_cards_limit}`, inline: true }));
        //                             page++;
        //                         }
        //                         pages[page - 1].addFields({ name: `${fields[i].current_origin}`, value: `${fields[i].ownedText}`, inline: false });
        //                     }
        //                 }

        //                 i++;
        //             }
        //         }
        //         else {
        //             if (owned.length == 0) {
        //                 ownedText = '[none]';
        //                 pages.push(new EmbedBuilder().addFields({ name: 'Currency', value: `${comma_adder.add(Math.trunc(credits))} credits`, inline: false }).addFields({ name: `Cards Owned`, value: `${ownedText}`, inline: false }));
        //             }
        //             else {
        //                 if (ownedText.length >= 600) {
        //                     fields.push({ ownedText: ownedText });
        //                     ownedText = '';
        //                 }

        //                 let lock = owned[i]._fieldsProto[`${msg.guildId}_protected`][owned[i]._fieldsProto[`${msg.guildId}_protected`].valueType] ? ' - 🛡️' : '';
        //                 // let sale = owned[i]._fieldsProto['for_sale'][owned[i]._fieldsProto['for_sale'].valueType] ? ' - ✅' : '';

        //                 ownedText += `${owned[i]._fieldsProto['name'][owned[i]._fieldsProto['name'].valueType]}${lock} - #${owned[i]._fieldsProto['rank'][owned[i]._fieldsProto['rank'].valueType]} - ${owned[i]._fieldsProto['stars'][owned[i]._fieldsProto['stars'].valueType]}\n`;

        //                 let value = 0;
        //                 switch (owned[i]._fieldsProto['rarity'][owned[i]._fieldsProto['rarity'].valueType]) {
        //                     case 'Common':
        //                         value = 250;
        //                         break;
        //                     case 'Uncommon':
        //                         value = 500;
        //                         break;
        //                     case 'Rare':
        //                         value = 2500;
        //                         break;
        //                     case 'Epic':
        //                         value = 5000;
        //                         break;
        //                     case 'Legendary':
        //                         value = 15000;
        //                         break;
        //                     case 'Ultimate':
        //                         value = 25000;
        //                         break;
        //                     default:
        //                         value = 0;
        //                 }

        //                 account_value += value;

        //                 if (i == owned.length - 1) {
        //                     fields.push({ ownedText: ownedText });
        //                     for (let i = 0; i < fields.length; i++) {
        //                         pages.push(new EmbedBuilder().addFields({ name: 'Currency', value: `${comma_adder.add(Math.trunc(credits))} credits`, inline: true }).addFields({ name: 'Card Count', value: `${lootbox_total_cards}/${lootbox_total_cards_limit}`, inline: true }).addFields({ name: 'Cards Owned', value: `${fields[i].ownedText}`, inline: false }));
        //                     }
        //                 }
        //                 i++;
        //             }
        //         }
        //     } while (i < owned.length);

        //     let pg = '';
        //     let j = 1;
        //     pages.forEach(page => {
        //         if (pages.length == 1) {
        //             pg = '';
        //         }
        //         else {
        //             pg = ` - p.${j}`;
        //         }
        //         page.setTitle(`${wrapText(`${db_user.pref_name ?? user.nickname ?? user.displayName}`, textWrap)}`)
        //             .setThumbnail(db_user.pref_image ?? user.displayAvatarURL())
        //             .setColor(db_user.pref_color ?? user.displayHexColor)
        //             .setFooter({ text: wrapText(`profile${pg}`, textWrap) })
        //             .setTimestamp();

        //         if (db_user.pref_status != null && db_user.pref_status != '') {
        //             page.setDescription(db_user.pref_status)
        //         }
        //         j++;
        //     });
        // }
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
                        pages.push(new EmbedBuilder().addFields({ name: 'Currency', value: `${comma_adder.add(Math.trunc(credits))} credits`, inline: false }));
                    }
                    else {
                        if (current_origin != owned[i]._fieldsProto['origin'][owned[i]._fieldsProto['origin'].valueType] && !owned[i]._fieldsProto['origin'][owned[i]._fieldsProto['origin'].valueType].includes(current_origin)) {
                            fields.push({ current_origin: current_origin, ownedText: ownedText });
                            ownedText = '';
                            current_origin = owned[i]._fieldsProto['origin'][owned[i]._fieldsProto['origin'].valueType];
                        }

                        let lock = owned[i]._fieldsProto[`${msg.guildId}_protected`][owned[i]._fieldsProto[`${msg.guildId}_protected`].valueType] ? ' - 🛡️' : '';
                        // let sale = owned[i]._fieldsProto['for_sale'][owned[i]._fieldsProto['for_sale'].valueType] ? ' - ✅' : '';

                        if (owned[i]._fieldsProto[`${msg.guildId}_locked`][owned[i]._fieldsProto[`${msg.guildId}_locked`].valueType] == true) {
                            ownedText += `Locked${lock} - ${owned[i]._fieldsProto['locked_id'][owned[i]._fieldsProto['locked_id'].valueType]} - ${owned[i]._fieldsProto['stars'][owned[i]._fieldsProto['stars'].valueType]}\n`;
                        }
                        else {
                            ownedText += `${owned[i]._fieldsProto['name'][owned[i]._fieldsProto['name'].valueType]}${lock} - #${owned[i]._fieldsProto['rank'][owned[i]._fieldsProto['rank'].valueType]} - ${owned[i]._fieldsProto['stars'][owned[i]._fieldsProto['stars'].valueType]}\n`;
                        }

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
                                    pages.push(new EmbedBuilder().addFields({ name: 'Currency', value: `${comma_adder.add(Math.trunc(credits))} credits`, inline: true }).addFields({ name: 'Card Count', value: `${lootbox_total_cards}/${lootbox_total_cards_limit}`, inline: true }).addFields({ name: 'Cards Value', value: `${comma_adder.add(Math.trunc(account_value))} credits`, inline: true }));
                                    page++;
                                }
                                pages[page - 1].addFields({ name: `${fields[i].current_origin}`, value: `${fields[i].ownedText}`, inline: false });
                            }
                        }

                        i++;
                    }
                }
                else {
                    if (owned.length == 0) {
                        ownedText = '[none]';
                        pages.push(new EmbedBuilder().addFields({ name: 'Currency', value: `${comma_adder.add(Math.trunc(credits))} credits`, inline: false }));
                    }
                    else {
                        if (ownedText.length >= 600) {
                            fields.push({ ownedText: ownedText });
                            ownedText = '';
                        }

                        let lock = owned[i]._fieldsProto[`${msg.guildId}_protected`][owned[i]._fieldsProto[`${msg.guildId}_protected`].valueType] ? ' - 🛡️' : '';
                        // let sale = owned[i]._fieldsProto['for_sale'][owned[i]._fieldsProto['for_sale'].valueType] ? ' - ✅' : '';

                        if (owned[i]._fieldsProto[`${msg.guildId}_locked`][owned[i]._fieldsProto[`${msg.guildId}_locked`].valueType] == true) {
                            ownedText += `Locked${lock} - ${owned[i]._fieldsProto['locked_id'][owned[i]._fieldsProto['locked_id'].valueType]} - ${owned[i]._fieldsProto['stars'][owned[i]._fieldsProto['stars'].valueType]}\n`;
                        }
                        else {
                            ownedText += `${owned[i]._fieldsProto['name'][owned[i]._fieldsProto['name'].valueType]}${lock} - #${owned[i]._fieldsProto['rank'][owned[i]._fieldsProto['rank'].valueType]} - ${owned[i]._fieldsProto['stars'][owned[i]._fieldsProto['stars'].valueType]}\n`;
                        }

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
                                pages.push(new EmbedBuilder().addFields({ name: 'Currency', value: `${comma_adder.add(Math.trunc(credits))} credits`, inline: true }).addFields({ name: 'Card Count', value: `${lootbox_total_cards}/${lootbox_total_cards_limit}`, inline: true }).addFields({ name: 'Cards Value', value: `${comma_adder.add(Math.trunc(account_value))} credits`, inline: true }).addFields({ name: 'Cards Owned', value: `${fields[i].ownedText}`, inline: false }));
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
                page.setTitle(`${wrapText(`${db_user.pref_name ?? user.nickname ?? user.displayName}`, textWrap)}`)
                    .setThumbnail(db_user.pref_image ?? user.displayAvatarURL())
                    .setColor(db_user.pref_color ?? user.displayHexColor)
                    .setFooter({ text: wrapText(`profile${pg}`, textWrap) })
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