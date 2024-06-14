
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const wrapText = require("wrap-text");
let textWrap = 31;

const comma_adder = require('commas');

module.exports = {
    name: 'credits',
    alias: ['c', 'bal'],
    description: "show me the money",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        try {
            if (msg.mentions.users.size == 1) {
                await this.credits_embed(discord_client, msg, msg.mentions.users.keys().next().value);
                return;
            }

            await this.credits_embed(discord_client, msg, msg.author.id);
        }
        catch (err) {
            msg.channel.send('Something went wrong with retrieving credits.');
            return;
        }
    },
    async credits_embed(discord_client, msg, id) {
        const { EmbedBuilder } = require('discord.js');

        let user = await require('../utility/queries').user(msg.guildId, id);
        let user_discord = msg.guild.members.cache.find(user => user.id === id);

        let savings = user?.savings ? +user.savings.credits : 0;

        // let lootbox_value = await this.get_lootbox_value(id);
        // let stocks_value = await this.get_stocks_value(msg, id);

        // let cumulative_value = +user.credits + +lootbox_value + +stocks_value;
        // let cumulative_value = +user.credits + +stocks_value;
        // let cumulative_value = +user.credits + savings;

        let currency_embed = new EmbedBuilder()
            .addFields({ name: 'Checking', value: `${comma_adder.add(Math.trunc(user.credits))} credits`, inline: false })
            .setTitle(`${user.pref_name ?? user_discord.nickname ?? user_discord.displayName}`)
            .setThumbnail(user.pref_image ?? user_discord.displayAvatarURL())
            .setColor(user.pref_color ?? user_discord.displayHexColor)
            .setFooter({ text: `credits` })
            .setTimestamp();

        if (user.pref_status != null && user.pref_status != '') {
            currency_embed.setDescription(wrapText(user.pref_status, textWrap));
        }

        // if (lootbox_value > 0) currency_embed.addFields({ name: 'Lootbox Value', value: `${comma_adder.add(Math.trunc(lootbox_value))} credits`, inline: false })
        // if (stocks_value > 0) currency_embed.addFields({ name: 'Stocks Value', value: `${comma_adder.add(Math.trunc(stocks_value))} credits`, inline: false })
        // if (cumulative_value > +user.credits) currency_embed.addFields({ name: 'Cumulative Value', value: `${comma_adder.add(Math.trunc(cumulative_value))} credits`, inline: false })
        if (savings > 0) currency_embed.addFields({ name: 'Savings', value: `${comma_adder.add(Math.trunc(savings))} credits`, inline: false })
        // if (cumulative_value > +user.credits) currency_embed.addFields({ name: 'Cumulative Value', value: `${comma_adder.add(Math.trunc(cumulative_value))} credits`, inline: false })


        msg.channel.send({ embeds: [currency_embed] });
    },
    async get_lootbox_value(id) {
        let total = 0;

        let characters = (await db.collection(`anime_cards`).where(`${msg.guildId}_owner_id`, '==', id).get())._docs();
        for (let character of characters) {
            character = character.data();

            let value = 0;
            switch (character.rarity) {
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

            total += value;
        }

        return total;
    },
    async get_stocks_value(msg, id) {
        let total = 0;

        let user = await require('../utility/queries').user(msg.guildId, id);
        let user_stocks = user.stocks ? user.stocks : {};

        for (let entry in user_stocks) {
            let stock_db = (await db.collection(`companies`).where('market', '==', true).where('symbol', '==', entry).limit(1).get())._docs()[0]?.data();
            const coinlore_client = new (require('coinlore-crypto-prices'))();
            await coinlore_client.getTicker(+stock_db.id).then((res, rej) => {
                if (res) {
                    let price = +(res)[0]?.price_usd;
                    total += (price / +stock_db.base_price) * 1000 * user_stocks[entry].count;
                }
            });
        }

        return total;
    }
}