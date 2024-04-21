// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

const wrapText = require("wrap-text");
let textWrap = 31;

module.exports = {
    name: 'profile',
    alias: ['p'],
    options: ['i', 'c', 'u'],
    description: "set profile",
    category: 'utility',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown
        let options = require('../utility/parsers').parse_command(msg, this.name, this.alias);

        let id = msg.mentions.users.keys().next().value ?? msg.author.id;
        args = args.filter(a => !a.includes('<@'));

        if (args.length == 0) {
            await this.display_profile(discord_client, msg, args, id, options);
            return;
        }
        else if (args.length == 1 && args[0].toLowerCase().includes('settings')) {
            await this.profile_settings_embed(msg);
            return;
        }
        else if (args.length >= 1) {
            if (['name', 'color', 'image', 'status', 'clear'].includes(args[0].toLowerCase())) {
                await this.profile_attribute_change(discord_client, msg, args);
                await require('../commands/credits').credits_embed(discord_client, msg, id);
                return;
            }

            await this.display_profile(discord_client, msg, args, id, options);
            return;
        }
    },
    async profile_settings_embed(msg) {
        let profile_guide = new EmbedBuilder()
            .setTitle(`${wrapText(`Kirby`, textWrap)}`)
            .setThumbnail('https://pbs.twimg.com/media/DplFZ4QUYAAYiel.jpg')
            .setColor(`#d44a98`)
            .setDescription(`It's a watermelon.\n\nThis is how you customize.`)
            .addFields({ name: 'name', value: `+profile name Kirby`, inline: false })
            .addFields({ name: 'color', value: `+profile color #d44a98`, inline: false })
            .addFields({ name: 'image', value: `+profile image https://image-link.jpg`, inline: false })
            .addFields({ name: 'status', value: `+profile status It's a watermelon.`, inline: false })
            .addFields({ name: 'clear', value: `+profile name clear (clears name)\n+profile clear (clears all)`, inline: false })
            .setFooter({ text: wrapText(`+profile settings`, textWrap) })
            .setTimestamp();

        msg.channel.send({ embeds: [profile_guide] });
        return;
    },
    async profile_attribute_change(discord_client, msg, args) {
        if (args.length == 1 && args[0].toLowerCase() == 'clear') {
            try {
                await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).update({
                    pref_name: FieldValue.delete(),
                    pref_image: FieldValue.delete(),
                    pref_color: FieldValue.delete(),
                    pref_status: FieldValue.delete(),
                });
            }
            catch (err) {
                console.log(err);
            }
            return;
        }

        if (args.length < 2) {
            msg.channel.send('Check **+profile settings** for preference change format.');
            return;
        }

        let att = args.shift();
        let pref_att = `pref_${att.toLowerCase()}`;
        let pref_value = args.join(' ');

        if (att.toLowerCase() == 'name') {
            if (pref_value.length <= 0 || pref_value.length > 30) {
                msg.channel.send('Names must be between 1 and 30 characters.');
                return;
            }
        }
        else if (att.toLowerCase() == 'image') {
            const isImageURL = require('image-url-validator').default;
            if (!(await isImageURL(pref_value))) {
                msg.channel.send('The image must be an image link.');
                return;
            }
        }
        else if (att.toLowerCase() == 'color') {
            const { validateHTMLColorHex } = require("validate-color");
            if (!validateHTMLColorHex(pref_value)) {
                msg.channel.send('The color must be a hex code.');
                return;
            }
        }
        else if (att.toLowerCase() == 'status') {
            if (pref_value.length <= 0 || pref_value.length > 280) {
                msg.channel.send('Statuses must be between 1 and 280 characters.');
                return;
            }
        }
        else {
            msg.channel.send('The available profile preference changes are: name, image, status and color.');
            return;
        }

        try {
            await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).update({
                [pref_att]: args[0].toLowerCase() == 'clear' ? FieldValue.delete() : pref_value.toString(),
            });
        }
        catch (err) {
            console.log(err);
        }
        return;
    },
    async display_profile(discord_client, msg, args, id, options) {

        let stars_count = args.length == 0 ? ['★', '★★', '★★★', '★★★★', '★★★★★', '★★★★★★'] : [];
        for (let arg of args) {
            if (arg.length == 1 && !isNaN(arg) && +arg <= 6) {
                let stars = '';
                for (let i = 0; i < +arg; i++) {
                    stars += '★';
                }
                stars_count.push(stars);
            }
            else if (arg.toLowerCase() == 'all') {
                stars_count = ['★', '★★', '★★★', '★★★★', '★★★★★', '★★★★★★'];
            }
        }

        let cards = [];
        if (options.includes('u')) {
            try { cards.push(...(await db.collection(`anime_cards`).where(`${msg.guildId}_owner_id`, '==', id).where(`${msg.guildId}_protected`, '==', false).where('stars', 'in', stars_count).orderBy("rank", "asc").get())._docs()); } catch (err) { console.log(err) }
        }
        else {
            try { cards.push(...(await db.collection(`anime_cards`).where(`${msg.guildId}_owner_id`, '==', id).where('stars', 'in', stars_count).orderBy("rank", "asc").get())._docs()); } catch (err) { console.log(err) }
        }
        cards = cards.map(card => card.data());

        let guild_member = await msg.guild.members.fetch(id);
        let db_user = await require('../utility/queries').user(msg.guildId, id);
        let credits = +db_user.credits;
        let lootbox_total_cards = db_user?.lootbox_total_cards ? +db_user.lootbox_total_cards : 0;
        let lootbox_total_cards_limit = db_user?.lootbox_total_cards_limit ? +db_user.lootbox_total_cards_limit : 100; // if not there, 100
        let lootbox_total_cards_value = db_user?.lootbox_total_cards_value ? +db_user.lootbox_total_cards_value : 0;

        let pages = [];
        if (cards.length == 0) {
            let { personalized_embed: profile_embed } = await require('../utility/embeds').personalized_embed(msg, id, db_user, guild_member);

            profile_embed.addFields({ name: 'Currency', value: `${comma_adder.add(Math.trunc(credits))} credits`, inline: true })
                .addFields({ name: 'Card Count', value: `${lootbox_total_cards}/${lootbox_total_cards_limit}`, inline: true })
                .addFields({ name: 'Cards Value', value: `${comma_adder.add(Math.trunc(lootbox_total_cards_value))} credits`, inline: true })
                .addFields({ name: `Cards Owned`, value: `[none]`, inline: false })

            pages.push(profile_embed);
        }
        else if (options.includes('i')) {
            if (options.includes('c')) cards = cards.sort((a, b) => { return (a.origin < b.origin) ? -1 : (a.origin > b.origin) ? 1 : 0; });
            for (let card of cards) {
                pages.push(await require('../utility/embeds').make_card_embed(discord_client, msg, card))
            }
        }
        else if (options.includes('c')) {
            cards = cards.sort((a, b) => { return (a.origin < b.origin) ? -1 : (a.origin > b.origin) ? 1 : 0; });

            let page_num = 0;
            let new_page = true;
            let field_info = '';
            let line_count = 0;
            for (let i = 0; i < cards.length; i++) {
                let profile_embed;
                if (new_page) {
                    ({ personalized_embed: profile_embed } = await require('../utility/embeds').personalized_embed(msg, id, db_user, guild_member));
                    profile_embed.addFields({ name: 'Currency', value: `${comma_adder.add(Math.trunc(credits))} credits`, inline: true })
                        .addFields({ name: 'Card Count', value: `${lootbox_total_cards}/${lootbox_total_cards_limit}`, inline: true })
                        .addFields({ name: 'Cards Value', value: `${comma_adder.add(Math.trunc(lootbox_total_cards_value))} credits`, inline: true });
                    pages.push(profile_embed);
                    new_page = false;
                    field_info = '';
                    line_count = 0;
                }

                if (!field_info) {
                    line_count += 2;
                    line_count += cards[i].origin.length >= 62 ? 1 : 0;
                }

                let protected = cards[i][`${msg.guildId}_protected`] ? ' - 🛡️' : '';
                field_info += `${cards[i].name}${protected} - #${cards[i].rank} - ${cards[i].stars}\n`;
                line_count += 1;

                if (((i + 1) >= cards.length) || cards[i].origin != cards[i + 1].origin || line_count >= 19) {
                    pages[page_num].addFields({ name: `${cards[i].origin}`, value: `${field_info}`, inline: false });
                    field_info = '';
                }

                if (line_count >= 19 || (!field_info && line_count >= 18)) {
                    page_num += 1;
                    new_page = true;
                }
            }
        }
        else {
            let page_num = 1;
            let card_info = '';
            for (let i = 0; i < cards.length; i++) {
                let protected = cards[i][`${msg.guildId}_protected`] ? ' - 🛡️' : '';
                card_info += `${cards[i].name}${protected} - #${cards[i].rank} - ${cards[i].stars}\n`;

                if (card_info.length >= 600 || ((i + 1) >= cards.length)) {
                    let { personalized_embed: profile_embed } = await require('../utility/embeds').personalized_embed(msg, id, db_user, guild_member);

                    profile_embed.addFields({ name: 'Currency', value: `${comma_adder.add(Math.trunc(credits))} credits`, inline: true })
                        .addFields({ name: 'Card Count', value: `${lootbox_total_cards}/${lootbox_total_cards_limit}`, inline: true })
                        .addFields({ name: 'Cards Value', value: `${comma_adder.add(Math.trunc(lootbox_total_cards_value))} credits`, inline: true })
                        .addFields({ name: `Cards Owned${cards.length == 0 ? '' : ` - ${page_num}`}`, value: `${card_info}`, inline: false })

                    pages.push(profile_embed);
                    page_num++;
                    card_info = '';
                }
            }
        }

        await require('../utility/pagination').paginationEmbed(msg, pages);
        require('../utility/timers').reset_timer(msg, this.name); // release resource
        return;
    }
}