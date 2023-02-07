
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'portfolio',
    alias: ['port'],
    description: "your stock portfolio",
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let portfolio_embed = new MessageEmbed()
                .setTitle(`Stock Portfolio`)
                // .setDescription(`Active portfolio and prices.`)
                // .setColor('#37914f')
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            // let stocks = (await db.collection(`companies`).where('market', '==', true).get())._docs();
            // for (let stock of stocks) {
            //     stock = stock.data();

            //     const coinlore_client = new (require('coinlore-crypto-prices'))();
            //     let price = (await coinlore_client.getTicker(+stock.id))[0]?.price_usd;
            //     if (price) {
            //         portfolio_embed.addField(stock.symbol, `${((+price/+stock.base_price) * 1000).toFixed(2)}`, false);
            //     }
            // }

            let user = await require('../utility/queries').user(msg.author.id);
            let user_stocks = user.stocks ? user.stocks : { fields: {} };

            for (let entry in user_stocks.fields) {
                user_stocks[entry] = { 'count': +user_stocks.fields[entry].mapValue.fields.count.integerValue, 'per': +user_stocks.fields[entry].mapValue.fields.per[user_stocks.fields[entry].mapValue.fields.per.valueType] };
            }
            delete user_stocks.fields;

            let port_earnings = 0;
            for (let stock in user_stocks) {
                let stock_db = (await db.collection(`companies`).where('market', '==', true).where('symbol', '==', stock).limit(1).get())._docs()[0]?.data();
                const coinlore_client = new (require('coinlore-crypto-prices'))();
                let price = +(await coinlore_client.getTicker(+stock_db.id))[0]?.price_usd;
                if (stock_db && price) {
                    let adj_price = +((+price / +stock_db.base_price) * 1000).toFixed(2);
                    let earnings = (adj_price - user_stocks[stock].per) * user_stocks[stock].count;
                    port_earnings += earnings;
                    portfolio_embed.addField(stock_db.symbol, `Quantity: ${user_stocks[stock].count}\nPercent Change: ${((adj_price - user_stocks[stock].per)/user_stocks[stock].per*100).toFixed(2)}%\nHoldings: ${(adj_price * user_stocks[stock].count).toFixed(2)}\nEarnings: ${earnings.toFixed(2)}`, false);
                }
            }

            if (Object.keys(user_stocks).length === 0) {
                portfolio_embed.setDescription('[none] -> **+stocks**');
            }
            else {
                portfolio_embed.addField('Current Earnings', `${port_earnings.toFixed(2)}`, false);
            }


            msg.channel.send({ embeds: [portfolio_embed] });
            return;
        }
    }
}