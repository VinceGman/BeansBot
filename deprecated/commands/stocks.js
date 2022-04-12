const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/beans.db');
const commaprint = require('comma-number');
const Coinlore = require('coinlore-crypto-prices');
const coinlore_client = new Coinlore();

module.exports = {
    name: 'stocks',
    description: "shows available stocks",
    admin: false,
    type: "test",
    execute(message, args, admin) {
        const index = require('../index.js').execute();
        let date = new Date();

        if (args.length == 1) {
            db.serialize(async () => {
                db.get('SELECT * FROM stocks WHERE ticker = ?', [args[0]], async (err, stocks_db) => {
                    if (err) {
                        message.channel.send("Fetching Problem.");
                        console.log(err);
                        return;
                    }
                    if (stocks_db == null || Object.keys(stocks_db).length === 0) {
                        message.channel.send("This stock doesn't exist. +stocks +store");
                        return;
                    }

                    let stock = await coinlore_client.getTicker(stocks_db.id).then((t) => {
                        return t;
                    }).catch(console.error);

                    // let stocksEmbed = new index.Discord.MessageEmbed()
                    //     .setColor(`#009588`)
                    //     .setTitle(`${stocks_db.ticker} - ${stocks_db.name}`)
                    //     .addField(`Price - ⋐${commaprint(+stock[0].price_usd)}`, `.`, false)
                    //     .addField(`Price Change 1h - ${commaprint(+stock[0].percent_change_1h)}%`, `.`, true)
                    //     .addField(`Price Change 24h - ${commaprint(+stock[0].percent_change_24h)}%`, `.`, true)
                    //     .addField(`Price Change 7d - ${commaprint(+stock[0].percent_change_7d)}%`, `.`, true)
                    //     .addField('About', stocks_db.description, false)
                    //     .setFooter(`${date.toDateString()}`)
                    //     .setTimestamp();

                    let arrow1h = stock[0].percent_change_1h >= 0 ? '<:green_arrow:942825990294482965>' : '<:red_arrow:942826037484589116>';
                    let arrow24h = stock[0].percent_change_24h >= 0 ? '<:green_arrow:942825990294482965>' : '<:red_arrow:942826037484589116>';
                    let arrow7d = stock[0].percent_change_7d >= 0 ? '<:green_arrow:942825990294482965>' : '<:red_arrow:942826037484589116>';

                    let stocksEmbed = new index.Discord.MessageEmbed()
                        .setTitle(`${stocks_db.ticker} | ${stocks_db.name} | ⋐${commaprint(+stock[0].price_usd)}`)
                        // .addField('Price', `⋐${commaprint(+stock[0].price_usd)}`, false)
                        .addField('Price Change 1h', `${commaprint(+stock[0].percent_change_1h)}% ${arrow1h}`, true)
                        .addField('Price Change 24h', `${commaprint(+stock[0].percent_change_24h)}% ${arrow24h}`, true)
                        .addField('Price Change 7d', `${commaprint(+stock[0].percent_change_7d)}% ${arrow7d}`, true)
                        .addField('About', stocks_db.description, false)
                        .setFooter(`${date.toDateString()}`)
                        .setTimestamp();

                    let color = stock[0].percent_change_7d >= 0 ? `#009588` : `#ee4646`;
                    stocksEmbed.setColor(color);

                    message.channel.send(stocksEmbed);
                });
            });
            return;
        }
        // TODO if there's an argument show the stock itself and its stats if there isn't just do all
        db.serialize(async () => {
            db.all('SELECT * FROM stocks', async (err, stocks_db) => {
                if (err) {
                    message.channel.send("Fetching Problem.");
                    return;
                }
                let stocksEmbed = new index.Discord.MessageEmbed()
                    .setColor(`#009588`)
                    .setTitle('Stocks | +stocks ticker')
                    .setFooter(`${date.toDateString()}`)
                    .setTimestamp();

                for (stock of stocks_db) {
                    let temp_stock = await coinlore_client.getTicker(stock.id).then((t) => {
                        return t;
                    }).catch(console.error);
                    let arrow24h = temp_stock[0].percent_change_24h >= 0 ? '<:green_arrow:942825990294482965>' : '<:red_arrow:942826037484589116>';
                    stocksEmbed.addField(stock.ticker, `⋐${commaprint(temp_stock[0].price_usd)} ${arrow24h}`, true);
                }
                message.channel.send(stocksEmbed);
            });

        });
    }
}