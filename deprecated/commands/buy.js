const { isInteger } = require("tmi.js/lib/utils");
const commaprint = require('comma-number');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/beans.db');
const Coinlore = require('coinlore-crypto-prices');
const coinlore_client = new Coinlore();

module.exports = {
    name: 'buy',
    description: "purchase an item",
    admin: false,
    type: "test",
    execute(message, args, admin) {

        let user = message.guild.members.cache.find(m => m.id == message.author.id);
        let name = user.nickname != null ? user.nickname : user.user.username;

        //Get first 100 coins
        // coinlore_client.getTickers(0, 100).then((t) => t.data.forEach(e => console.log(e.symbol, e.id, e.price_usd))).catch(console.error);

        // get Bitcoin info
        // coinlore_client.getTicker(90).then(console.log).catch(console.error);

        // 48537   54.16
        // 2       0.146342
        // 45219   18.84
        // 45985   8.03
        // 8       103.47

        if (args.length == 0) {
            message.channel.send("Please specify which item: +buy itemname (count)");
        }
        else if (args.length == 1) {
            try {
                db.serialize(async () => {
                    db.get('SELECT * FROM stocks WHERE ticker = ?', [args[0]], async (err, stocks_db) => {
                        if (err) {
                            message.channel.send("Fetching Problem.");
                            return;
                        }
                        if (stocks_db == null || Object.keys(stocks_db).length === 0) {
                            message.channel.send("This stock doesn't exist. +stocks +store");
                            return;
                        }

                        db.get('SELECT * FROM beans WHERE id = ?', [message.author.id], async (err, beans_db) => {
                            if (err) {
                                message.channel.send("Fetching Problem.");
                                return;
                            }

                            let stock = await coinlore_client.getTicker(stocks_db.id).then((t) => {
                                return t;
                            }).catch(console.error);

                            if ((stock[0].price_usd) <= beans_db.credits) {
                                await purchase(message, args[0], 1);
                                message.channel.send(`${name} purchased a unit of ${args[0]} at ⋐${commaprint(stock[0].price_usd)}.`);
                            }
                            else {
                                message.channel.send(`${name}, one unit of ${args[0]} cost ⋐${commaprint(stock[0].price_usd)} and you don't have enough funds.`);
                            }
                        });
                    });
                });
            }
            catch (e) {
                message.channel.send('This purchase could not be completed.');
            }
        }
        else if (args.length == 2) {
            if (isNaN(args[1]) || !Number.isInteger(+args[1])) {
                message.channel.send('Incorrect Format: +buy itemname (count)');
                return;
            }
            try {
                db.serialize(async () => {
                    db.get('SELECT * FROM stocks WHERE ticker = ?', [args[0]], async (err, stocks_db) => {
                        if (err) {
                            message.channel.send("Fetching Problem.");
                            return;
                        }
                        if (stocks_db == null || Object.keys(stocks_db).length === 0) {
                            message.channel.send("This stock doesn't exist. +stocks +store");
                            return;
                        }

                        db.get('SELECT * FROM beans WHERE id = ?', [message.author.id], async (err, beans_db) => {
                            if (err) {
                                message.channel.send("Fetching Problem.");
                                return;
                            }

                            let stock = await coinlore_client.getTicker(stocks_db.id).then((t) => {
                                return t;
                            }).catch(console.error);

                            if ((stock[0].price_usd * args[1]) <= beans_db.credits) {
                                // buying logic, get inventory and update purchases
                                await purchase(message, args[0], args[1]);
                                message.channel.send(`${name} purchased ${args[1]} units of ${args[0]} at ⋐${commaprint(stock[0].price_usd)} for a total of ⋐${commaprint((stock[0].price_usd * args[1]).toFixed(2))}.`);
                            }
                            else {
                                message.channel.send(`${name}, ${commaprint(args[1])} units of ${args[0]} cost ⋐${commaprint((stock[0].price_usd * args[1]).toFixed(2))} and you don't have enough funds.`);
                            }
                        });
                    });
                });
            }
            catch (e) {
                message.channel.send('This purchase could not be completed.');
            }
        }
        else {
            message.channel.send('Incorrect Format: +buy itemname (count)');
        }

    }
}


async function purchase(message, ticker, quantity) {
    console.log('buying', ticker, quantity);
    db.serialize(async () => {
        db.all("SELECT * FROM inventory WHERE id=? AND itemname=?", [message.author.id, ticker], async (err, inventory_db) => {
            if (err) {
                message.channel.send("Fetching Problem.");
                return;
            }
            if (inventory_db.length == 0) {
                // proper buying logic if there's none in inventory
            }
            else if (inventory_db.length == 1) {
                // proper buying logic if there's already some in inventory
            }
            else if (inventory_db.length >= 2) {
                message.channel.send("Please ping Sore and tell him the buying logic is giga broken.");
            }
            else {
                message.channel.send("Something legitimately broke.");
            }
        });
    });
}