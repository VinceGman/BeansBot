
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'buy',
    description: "buy stocks",
    category: 'stocks',
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        try {
            const { EmbedBuilder } = require('discord.js');

            if (args.length == 0) {
                let buy_guide = new EmbedBuilder()
                    .setTitle(`Buy Guide`)
                    .setDescription(`Buy Stocks`)
                    .setColor('#37914f')
                    .addFields({ name: '+buy CBC', value: `Buys 1 unit of Coffee Beans Coins (CBC) stock.`, inline: false })
                    .addFields({ name: '+buy 5 CBC', value: `Buys 5 units of Coffee Beans Coins (CBC) stock.`, inline: false })
                    .addFields({ name: '+buy CBC 12', value: `Buys 12 units of Coffee Beans Coins (CBC) stock.`, inline: false })
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                msg.channel.send({ embeds: [buy_guide] });
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
                msg.channel.send('See -> **+buy**');
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

            if (+stock_db.public < quantity) {
                msg.channel.send(`Quantity of this stock available: ${+stock_db.public}`);
                return;
            }

            const coinlore_client = new (require('coinlore-crypto-prices'))();
            let price = +(await coinlore_client.getTicker(+stock_db.id))[0]?.price_usd;
            if (!price) {
                msg.channel.send('Stock API failed. Try again.');
                return
            }

            let cost = (price / +stock_db.base_price) * 1000 * quantity;

            let user = await require('../utility/queries').user(msg.author.id);
            let user_stocks = user.stocks ? user.stocks : {};

            let stock_count = 0;
            for (let stk in user_stocks) {
                stock_count += user_stocks[stk].count;
            }
            if (stock_count + quantity > 1000) {
                msg.channel.send(`You may only own 1000 stocks. You have ${1000 - stock_count} slots left.`);
                return;
            }

            if (!(await require('../utility/credits').transaction(discord_client, msg, cost))) return; // credits manager validates transaction

            if (!user_stocks?.[stock_symbol]) user_stocks[stock_symbol] = { count: 0, per: 0 };

            user_stocks[stock_symbol].per = +(((user_stocks[stock_symbol].count * user_stocks[stock_symbol].per) + cost) / (user_stocks[stock_symbol].count + quantity)).toFixed(2);
            user_stocks[stock_symbol].count += quantity;
            let new_public = +stock_db.public - quantity;

            await db.doc(`members/${msg.author.id}`).update({
                stocks: user_stocks,
            });

            await db.doc(`companies/${stock_ref._ref._path.segments[1]}`).set({
                public: new_public.toString(),
            }, { merge: true });

            msg.channel.send(`${msg.author.username} - Order Completed: [Buy] ${quantity} ${stock_symbol} (${(cost / quantity).toFixed(2)}/unit) - Cost: ${cost.toFixed(2)}`);
        }
        catch (err) {
            msg.channel.send('Something went wrong.');
            return
        }
    }
}
// } else if (isNaN(args[0]) && isNaN(args[1])) {
//     if (args[0].toLowerCase() == 'max') {
//         stock_symbol = args[1];
//         quantity = args[0];
//     } else if (args[1].toLowerCase() == 'max') {
//         stock_symbol = args[0];
//         quantity = args[1];
//     }