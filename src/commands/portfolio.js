
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'portfolio',
    alias: ['port'],
    options: ['d'],
    description: "your stock portfolio",
    category: 'stocks',
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown
        let options = require('../utility/parsers').parse_command(msg, this.name, this.alias);

        const { EmbedBuilder } = require('discord.js');

        if (args.length == 0 && options.includes('d')) {
            let portfolio_embed = new EmbedBuilder()
                .setTitle(`Stock Portfolio`)
                // .setDescription(`Active portfolio and prices.`)
                // .setColor('#37914f')
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            let user = await require('../utility/queries').user(msg.author.id);
            let user_stocks = user.stocks ? user.stocks : {};

            let port_earnings = 0;
            for (let stock in user_stocks) {
                let stock_db = (await db.collection(`companies`).where('market', '==', true).where('symbol', '==', stock).limit(1).get())._docs()[0]?.data();
                const coinlore_client = new (require('coinlore-crypto-prices'))();
                let price = +(await coinlore_client.getTicker(+stock_db.id))[0]?.price_usd;
                if (stock_db && price) {
                    let adj_price = +((+price / +stock_db.base_price) * 1000).toFixed(2);
                    let earnings = (adj_price - user_stocks[stock].per) * user_stocks[stock].count;
                    port_earnings += earnings;
                    portfolio_embed.addFields({ name: stock_db.symbol, value: `Quantity: ${user_stocks[stock].count}\nPrice/Unit: ${user_stocks[stock].per}\nPercent Change: ${((adj_price - user_stocks[stock].per) / user_stocks[stock].per * 100).toFixed(2)}%\nHoldings: ${(adj_price * user_stocks[stock].count).toFixed(2)}\nEarnings: ${earnings.toFixed(2)}`, inline: false });
                }
            }

            if (Object.keys(user_stocks).length === 0) {
                portfolio_embed.setDescription('[none] -> **+stocks**');
            }
            else {
                portfolio_embed.addFields({ name: 'Current Earnings', value: `${port_earnings.toFixed(2)}`, inline: false });
            }


            msg.channel.send({ embeds: [portfolio_embed] });
            return;
        }
        else if (args.length == 0 && !options.includes('u')) {
            let portfolio_embed = new EmbedBuilder()
                .setTitle(`Stock Portfolio`)
                // .setDescription(`Active portfolio and prices.`)
                // .setColor('#37914f')
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            let user = await require('../utility/queries').user(msg.author.id);
            let user_stocks = user.stocks ? user.stocks : {};

            let total_current_price = 0;
            let total_purchase_price = 0;
            let stocks_count = '';
            for (let stock in user_stocks) {
                let stock_db = (await db.collection(`companies`).where('market', '==', true).where('symbol', '==', stock).limit(1).get())._docs()[0]?.data();
                const coinlore_client = new (require('coinlore-crypto-prices'))();
                let price = +(await coinlore_client.getTicker(+stock_db.id))[0]?.price_usd;
                if (stock_db && price) {
                    total_current_price += +((+price / +stock_db.base_price) * 1000).toFixed(2) * user_stocks[stock].count;
                    total_purchase_price += user_stocks[stock].per * user_stocks[stock].count;
                    stocks_count += `${stock}: ${user_stocks[stock].count}\n`;
                }
            }

            if (Object.keys(user_stocks).length === 0) {
                portfolio_embed.setDescription('[none] -> **+stocks**');
            }
            else {
                portfolio_embed.addFields({ name: 'Stocks', value: `${stocks_count}`, inline: false });
                portfolio_embed.addFields({ name: `Combined Holdings`, value: `${(total_current_price).toFixed(2)}`, inline: false });
                portfolio_embed.addFields({ name: `Percent Change`, value: `${((total_current_price - total_purchase_price) / total_purchase_price * 100).toFixed(2)}%`, inline: false });
                portfolio_embed.addFields({ name: `Earnings`, value: `${(total_current_price - total_purchase_price).toFixed(2)}`, inline: false });
            }

            msg.channel.send({ embeds: [portfolio_embed] });
            return;
        }
    }
}