
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'credits',
    alias: ['creds', 'c', 'value'],
    description: "show me the money",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        if (args.length == 0) {
            await this.output_value(msg, msg.author.id);
        }
        else if (msg.mentions.users.size == 1) {
            await this.output_value(msg, msg.mentions.users.keys().next().value);
        }

        return;
    },
    async output_value(msg, id) {
        const { MessageEmbed } = require('discord.js');

        let user = await require('../utility/queries').user(id);
        let user_discord = await msg.guild.members.fetch(id);

        let lootbox_value = await this.get_lootbox_value(id);
        let stocks_value = await this.get_stocks_value(id);

        let cumulative_value = +user.credits + +lootbox_value + +stocks_value;

        let currency_embed = new MessageEmbed()
            .addField('Currency', `${user.credits} credits`, false)
            .setTitle(`${user.pref_name ?? user_discord.author.username}`)
            .setThumbnail(user.pref_image ?? user_discord.author.avatarURL())
            .setColor(user.pref_color ?? `#ADD8E6`)
            .setFooter({ text: `Credits` })
            .setTimestamp();

        if (lootbox_value > 0) currency_embed.addField('Lootbox Value', `${lootbox_value.toFixed(2)} credits`, false)
        if (stocks_value > 0) currency_embed.addField('Stocks Value', `${stocks_value.toFixed(2)} credits`, false)
        if (cumulative_value > +user.credits) currency_embed.addField('Cumulative Value', `${cumulative_value.toFixed(2)}`, false)

        msg.channel.send({ embeds: [currency_embed] });
    },
    async get_lootbox_value(id) {
        let total = 0;

        let characters = (await db.collection(`edition_one`).where('owner_id', '==', id).get())._docs();
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
    async get_stocks_value(id) {
        let total = 0;

        let user = await require('../utility/queries').user(id);
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