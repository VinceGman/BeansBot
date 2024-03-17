
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

const wrapText = require("wrap-text");
let textWrap = 2000;

module.exports = {
    name: 'wish',
    alias: ['wishlist', 'unwish', 'wl'],
    alias_show: [],
    options: ['i'],
    description: "wish for a card",
    category: 'cards',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown
        let options = require('../utility/parsers').parse_command(msg, this.name, this.alias);

        if (msg.content.toLowerCase() == '+wishlist') options = options.filter(op => op != 'i');

        if ((msg.content.toLowerCase().startsWith('+wish') && !msg.content.toLowerCase().startsWith('+wishlist') && args.length == 0) || (msg.content.toLowerCase().startsWith('+unwish') && args.length == 0)) {
            this.wish_guide(msg);
            return;
        }

        let db_user = await require('../utility/queries').user(msg.author.id);
        let wishlist = db_user?.wishlist ? db_user.wishlist : [];
        let wishlist_max_size = db_user?.wishlist_max_size ? +db_user.wishlist_max_size : 5;

        if (msg.content.toLowerCase().startsWith('+wishlist') || msg.content.toLowerCase().startsWith('+wl')) {
            if (args.length == 0) {
                await this.show_wishlist(discord_client, msg, options);
                return;
            }
            else if (args.length == 1 && args[0].toLowerCase() == 'clear') {
                await db.doc(`members/${msg.author.id}`).update({
                    wishlist: FieldValue.delete(),
                }).catch(err => msg.channel.send(`${msg.author.username} - This action wasn't completed properly. Please contact Sore#1414.`));

                await this.show_wishlist(discord_client, msg, options);
                return;
            }
            else {
                this.wish_guide(msg);
                return;
            }
        }

        let characters = await require('../utility/queries').character(msg, args);
        if (!characters) return;

        if (msg.content.toLowerCase().startsWith('+wish')) {
            if (wishlist.length >= wishlist_max_size) {
                await require('../utility/embeds').notice_embed(discord_client, msg, "Your wishlist is max size. -> **+upgrade**", '#ebcf34');
                return;
            }
            if (wishlist.includes(characters[0].rank_text)) {
                await this.show_wishlist(discord_client, msg, options);
                return;
            }
            wishlist.push(characters[0].rank_text);
            wishlist.sort((a, b) => +a - +b);
        }
        else if (msg.content.toLowerCase().startsWith('+unwish')) {
            if (!wishlist.includes(characters[0].rank_text)) {
                await this.show_wishlist(discord_client, msg, options);
                return;
            }
            wishlist = wishlist.filter(w => w != characters[0].rank_text);
        }

        await db.doc(`members/${msg.author.id}`).update({
            wishlist: wishlist,
        }).catch(err => msg.channel.send(`${msg.author.username} - This product wasn't stored properly. Please contact Sore#1414.`));

        await this.show_wishlist(discord_client, msg, options);
        return;
    },
    async wish_guide(msg) {
        let db_user = await require('../utility/queries').user(msg.author.id);
        let wish_chance = db_user?.wish_chance ? +db_user.wish_chance : 5;
        let wish_guide = new EmbedBuilder()
            .setTitle(`Wish Guide`)
            .setDescription(`Wishing for a card increases your chances of rolling it and notifies you when it's rolled.`)
            .setColor('#000000')
            .addFields({ name: 'Wish Chances', value: `${(wish_chance * 2)}x more likely to roll a wish`, inline: false })
            .addFields({ name: '+wish 12', value: `Adds card with rank #12 to wishlist`, inline: false })
            .addFields({ name: '+unwish 12', value: `Removes card with rank #12 from wishlist`, inline: false })
            .addFields({ name: '+wishlist', value: `Shows wishlist`, inline: false })
            .addFields({ name: '+wishlist clear', value: `Clears wishlist`, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [wish_guide] });
        require('../utility/timers').reset_timer(msg, this.name); // release resource
    },
    async show_wishlist(discord_client, msg, options) {
        let db_user = await require('../utility/queries').user(msg.author.id);
        let wishlist = db_user?.wishlist ? db_user.wishlist : [];
        let wishlist_max_size = db_user?.wishlist_max_size ? +db_user.wishlist_max_size : 5;
        let wish_chance = db_user?.wish_chance ? +db_user.wish_chance : 5;

        let characters = [];
        try {
            characters = ((await db.collection(`anime_cards`).where('rank_text', 'in', wishlist).orderBy("rank", "asc").get())._docs()).map(card => card.data());
        }
        catch (err) {
            characters = [];
        }

        let pages = [];
        if (options.includes('i') && characters.length > 0) {
            for (let character of characters) {
                pages.push(await require('../utility/embeds').make_card_embed(discord_client, msg, character))
            }
        }
        else {
            let discord_user = await msg.guild.members.fetch(msg.author.id);
            let profile_embed = new EmbedBuilder()
                .setTitle(`${wrapText(`${db_user.pref_name ?? discord_user.nickname ?? discord_user.displayName}`, textWrap)}`)
                .setThumbnail(db_user.pref_image ?? discord_user.displayAvatarURL())
                .setColor(db_user.pref_color ?? discord_user.displayHexColor)
                .addFields({ name: 'Wish Chances', value: `${(wish_chance * 2)}x more likely to roll a wish`, inline: false })
                .setFooter({ text: `${characters.length}/${wishlist_max_size}` })
                .setTimestamp();

            if (db_user.pref_status != null && db_user.pref_status != '') {
                profile_embed.setDescription(wrapText(db_user.pref_status, textWrap));
            }

            if (characters.length == 0) {
                profile_embed.addFields({ name: 'Wishlist', value: `[none]`, inline: false });
            }
            else {
                let wishlist_text = '';
                for (let character of characters) {
                    try {
                        user = await discord_client.users.fetch(character[`${msg.guildId}_owner_id`]);
                        if (character[`${msg.guildId}_locked`] == true) {
                            wishlist_text += `${character.name} - #${character.rank}\n`;
                        }
                        else {
                            wishlist_text += `**${character.name} - #${character.rank} => ${user.username}**\n`;
                        }
                    }
                    catch (err) {
                        wishlist_text += `${character.name} - #${character.rank}\n`;
                    }
                }
                profile_embed.addFields({ name: 'Wishlist', value: `${wishlist_text}`, inline: false });
            }

            pages.push(profile_embed);
        }

        await require('../utility/pagination').paginationEmbed(msg, pages);
        require('../utility/timers').reset_timer(msg, this.name); // release resource
        return;
    },
    async notice_wishlist(discord_client, rolling_msg, character) {
        let members_to_notify = ((await db.collection(`members`).where('wishlist', 'array-contains', character.rank_text).get())._docs()).map(m => m._ref._path.segments[1]);

        let prompt = 'Your wishlist item was rolled:';
        let wishlist_notification = prompt;
        for (let memberID of members_to_notify) {
            try {
                let user = await rolling_msg.guild.members.fetch(memberID);
                wishlist_notification += ` ${user}`;
            }
            catch (err) {
                // console.log(err);
            }
        }
        if (prompt != wishlist_notification) rolling_msg.reply(`${wishlist_notification}`);
    }
}