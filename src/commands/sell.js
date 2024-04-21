
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const comma_adder = require('commas');

module.exports = {
    name: 'sell',
    alias: ['testsell'],
    description: "sell stocks",
    category: 'stocks',
    admin: false,
    type: "test",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        try {
            const { EmbedBuilder } = require('discord.js');

            if (args.length == 0) {
                let sell_guide = new EmbedBuilder()
                    .setTitle(`Sell Guide`)
                    .setDescription(`Sell Stocks`)
                    .setColor('#37914f')
                    .addFields({ name: '+sell CBC', value: `Sells 1 unit of Coffee Beans Coins (CBC) stock.`, inline: false })
                    .addFields({ name: '+sell 5 CBC', value: `Sells 5 units of Coffee Beans Coins (CBC) stock.`, inline: false })
                    .addFields({ name: '+sell CBC 12', value: `Sells 12 units of Coffee Beans Coins (CBC) stock.`, inline: false })
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                msg.channel.send({ embeds: [sell_guide] });
                return;
            }

            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            let stock_symbol, quantity;
            if (args.length == 1) {
                if (isNaN(args[0])) {
                    stock_symbol = args[0];
                    quantity = 1;
                }
            }
            else if (args.length == 2) {
                if (isNaN(args[0]) && !isNaN(args[1])) {
                    stock_symbol = args[0];
                    quantity = +args[1];
                } else if (!isNaN(args[0]) && isNaN(args[1])) {
                    stock_symbol = args[1];
                    quantity = +args[0];
                }
            }

            if (!stock_symbol || !quantity) {
                msg.channel.send('See -> **+sell**');
                return;
            }

            if (quantity <= 0 || `${quantity}`.includes('.')) {
                msg.channel.send('Your number must be a positive integer.');
                return;
            }

            stock_symbol = stock_symbol.toUpperCase();
            let stock_ref = (await db.collection(`companies`).where('market', '==', true).where('symbol', '==', stock_symbol).limit(1).get())._docs()[0];
            let stock_db = stock_ref?.data();
            if (!stock_db) {
                msg.channel.send('Find supported stocks here -> **+stocks**');
                return;
            }

            let user = await require('../utility/queries').user(msg.guildId, msg.author.id);
            let user_stocks = user.stocks ? user.stocks : {};

            if (!user_stocks?.[stock_symbol]) user_stocks[stock_symbol] = { count: 0, per: 0 };

            if (user_stocks[stock_symbol].count < quantity) {
                msg.channel.send(`Quantity of this stock available: ${user_stocks[stock_symbol].count}`);
                return;
            }

            const coinlore_client = new (require('coinlore-crypto-prices'))();
            let price = +(await coinlore_client.getTicker(+stock_db.id))[0]?.price_usd;
            if (!price) {
                msg.channel.send('Stock API failed. Try again.');
                return
            }

            let cost_per_unit = (price / +stock_db.base_price) * 1000;
            let cost = cost_per_unit * quantity;
            // if (cost_per_unit > user_stocks[stock_symbol].per) {
            //     cost = (((cost_per_unit - user_stocks[stock_symbol].per) * 0.75) + user_stocks[stock_symbol].per) * quantity;
            // }
            // else {
            //     cost = cost_per_unit * quantity;
            // }

            user_stocks[stock_symbol].count -= quantity;
            if (user_stocks[stock_symbol].count == 0) {
                delete user_stocks[stock_symbol];
            }

            await require('../utility/credits').refund(discord_client, msg, msg.author.id, cost); // credits manager refunds creditsFF

            let new_public = +stock_db.public + quantity;

            await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).update({
                stocks: user_stocks,
            });

            await db.doc(`companies/${stock_ref._ref._path.segments[1]}`).set({
                public: new_public.toString(),
            }, { merge: true });

            let buy_embed = new EmbedBuilder()
                .setTitle(`Order Filled - [Sell]`)
                .setColor('#37914f')
                .addFields({ name: 'Price/Unit', value: `${comma_adder.add(cost_per_unit.toFixed(2))}`, inline: true })
                .addFields({ name: `${stock_symbol}`, value: `${quantity}`, inline: true })
                .addFields({ name: 'Total Earned', value: `${comma_adder.add(cost.toFixed(2))}`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [buy_embed] });
            return;
        }
        catch (err) {
            console.log(err);
            msg.channel.send('Something went wrong.');
            return
        }
    }
}