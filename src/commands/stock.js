// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const fs = require('fs');

module.exports = {
    name: 'stock',
    options: ['s'],
    description: "see stocks",
    category: 'stocks',
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown
        let options = require('../utility/parsers').parse_command(msg, this.name, this.alias);

        const { EmbedBuilder } = require('discord.js');

        if (options.includes('s')) {
            let stocks_embed = new EmbedBuilder()
                .setTitle(`Stocks`)
                .setDescription(`Active stocks and prices. -> **+buy** or **+sell**`)
                .setColor('#37914f')
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            let stocks = (await db.collection(`companies`).where('market', '==', true).get())._docs();
            for (let stock of stocks) {
                stock = stock.data();

                const coinlore_client = new (require('coinlore-crypto-prices'))();
                let price = (await coinlore_client.getTicker(+stock.id))[0]?.price_usd;
                if (price && stock.public > 0) {
                    stocks_embed.addFields({ name: `${stock.symbol} - Open Shares: ${stock.public}`, value: `${((+price / +stock.base_price) * 1000).toFixed(2)}`, inline: false });
                }
            }

            msg.channel.send({ embeds: [stocks_embed] });
            return;
        }
        else if (args.length == 0) {
            let stocks_embed = new EmbedBuilder()
                .setTitle(`Stock Guide`)
                .setDescription(`Active stocks and prices. -> **+stocks**`)
                .setColor('#37914f')
                .addFields({ name: '+stock CBC', value: 'Shows the CBC stock.', inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [stocks_embed] });
            return;
        }
        else if (args.length == 1) {
            let stock_ref = (await db.collection(`companies`).where('market', '==', true).where('symbol', '==', args[0].toUpperCase()).limit(1).get())._docs()[0];
            let stock_db = stock_ref?.data();
            if (!stock_db) {
                msg.channel.send('Find supported stocks here -> **+stocks**');
                return;
            }
            await this.stock_info(discord_client, msg, [stock_db]);
        }
    },
    async stock_info(discord_client, msg, stocks) {
        const { EmbedBuilder } = require('discord.js');
        const stocks_embed = new EmbedBuilder();

        for (let entry in stocks) {
            const coinlore_client = new (require('coinlore-crypto-prices'))();
            let stock = (await coinlore_client.getTicker(stocks[entry].id))[0];
            if (stock) {
                const members = (await db.collection('members').get())._docs();
                let majority_holders = '';
                for (let member_ref of members) {
                    member = member_ref.data();
                    if (member.stocks && member.stocks[stocks[entry].symbol] && member.stocks[stocks[entry].symbol].count >= 500) {
                        let member_id = member_ref._ref._path.segments[1];
                        let user = await discord_client.users.fetch(member_id);
                        if (user) {
                            majority_holders += `${user.username}#${user.discriminator} - Shares: ${member.stocks[stocks[entry].symbol].count}\n`;
                        }
                    }
                }

                stocks_embed.setTitle(`${stocks[entry].symbol}`)
                    .setColor('#37914f')
                    .addFields({ name: `Price`, value: `${((+stock.price_usd / +stocks[entry].base_price) * 1000).toFixed(2)}`, inline: false })
                    .addFields({ name: `Open Shares`, value: `${stocks[entry].public}`, inline: false })
                    .addFields({ name: `1h`, value: `${stock.percent_change_1h}%`, inline: true })
                    .addFields({ name: `24h`, value: `${stock.percent_change_24h}%`, inline: true })
                    .addFields({ name: `7d`, value: `${stock.percent_change_7d}%`, inline: true })
                    .addFields({ name: `Model`, value: `${stocks[entry].real_stock}`, inline: false })
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                if (majority_holders != '') {
                    stocks_embed.addFields({ name: 'Majority Holders', value: majority_holders, inline: false });
                }
            }
        }

        await msg.channel.send({ embeds: [stocks_embed] });

    }
}