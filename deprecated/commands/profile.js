const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/beans.db');
const commaprint = require('comma-number');
const { firebase } = require('googleapis/build/src/apis/firebase');
const Coinlore = require('coinlore-crypto-prices');
const coinlore_client = new Coinlore();

module.exports = {
    name: 'profile',
    description: "profile information",
    admin: false,
    type: "test",
    async execute(message, args, admin) {
        const index = require('../index.js').execute();
        let date = new Date();

        db.serialize(() => {
            db.get('SELECT * FROM beans WHERE id = ?', [message.author.id], async (err, beans_db) => {
                if (err) {
                    message.channel.send("Fetching Problem.");
                    return;
                }
                db.all('SELECT * FROM inventory WHERE id = ?', [message.author.id], async (err, inventory_db) => {
                    if (err) {
                        message.channel.send("Fetching Problem.");
                        return;
                    }
                    db.all('SELECT * FROM stocks', async (err, stocks_db) => {
                        if (err) {
                            message.channel.send("Fetching Problem.");
                            return;
                        }
                        if (beans_db == null || inventory_db == null || stocks_db == null) {
                            message.channel.send("There was an error fetching user's data.");
                            return;
                        }
                        else {
                            // console.log('beans', beans_db);
                            // console.log('inventory', inventory_db);
                            // console.log('stocks', stocks_db);
                        }

                        let user = message.guild.members.cache.find(m => m.id == message.author.id);

                        let profileEmbed = new index.Discord.MessageEmbed()
                            .setColor(`#eece97`)
                            .addField('Credits', `⋐${commaprint(beans_db.credits.toFixed(2))}`, false) // ⊑ 〥 // .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                            .setFooter(`${date.toDateString()}`)
                            .setTimestamp();
                        
                        let name = user.nickname != null ? user.nickname : user.user.username;
                        profileEmbed.setTitle(name);

                        let networth = beans_db.credits;
                        for (item of inventory_db) {
                            if (item.type == 'stock') {
                                try {
                                    await coinlore_client.getTicker(stocks_db.find(e => e.ticker == item.itemname).id).then((t) => {
                                        networth += (t[0].price_usd * item.quantity);
                                    }).catch(console.error);
                                }
                                catch (e) {
                                    console.log("This stock doesn't exist");
                                }
                            }
                            else {
                                networth += (item.price * item.quantity);
                            }
                            profileEmbed.addField(item.itemname, `# ${item.quantity}`, true);
                        }

                        profileEmbed.addField('Networth', `⋐${commaprint(networth.toFixed(2))}`, false);

                        message.channel.send(profileEmbed);
                    });
                });
            });
        });
    }
}