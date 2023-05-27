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

        const { MessageEmbed } = require('discord.js');

        if (options.includes('s')) {
            let stocks_embed = new MessageEmbed()
                .setTitle(`Stocks`)
                .setDescription(`Active stocks and prices. -> **+buy** or **+sell**`)
                .setColor('#37914f')
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            let stocks = (await db.collection(`companies`).where('market', '==', true).get())._docs();
            for (let stock of stocks) {
                stock = stock.data();

                const coinlore_client = new (require('coinlore-crypto-prices'))();
                let price = (await coinlore_client.getTicker(+stock.id))[0]?.price_usd;
                if (price && stock.public > 0) {
                    stocks_embed.addField(`${stock.symbol} - Open Shares: ${stock.public}`, `${((+price / +stock.base_price) * 1000).toFixed(2)}`, false);
                }
            }

            msg.channel.send({ embeds: [stocks_embed] });
            return;
        }
        else if (args.length == 0) {
            let stocks_embed = new MessageEmbed()
                .setTitle(`Stock Guide`)
                .setDescription(`Active stocks and prices. -> **+stocks**`)
                .setColor('#37914f')
                .addField('+stock CBC', 'Shows the CBC stock.')
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
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
        const { MessageEmbed } = require('discord.js');
        const stocks_embed = new MessageEmbed();

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
                    .addField(`Price`, `${((+stock.price_usd / +stocks[entry].base_price) * 1000).toFixed(2)}`, false)
                    .addField(`Open Shares`, `${stocks[entry].public}`, false)
                    .addField(`1h`, `${stock.percent_change_1h}%`, true)
                    .addField(`24h`, `${stock.percent_change_24h}%`, true)
                    .addField(`7d`, `${stock.percent_change_7d}%`, true)
                    .addField(`Model`, `${stocks[entry].real_stock}`, false)
                    .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                    .setTimestamp();

                if (majority_holders != '') {
                    stocks_embed.addField('Majority Holders', majority_holders, false);
                }
            }
        }

        await msg.channel.send({ embeds: [stocks_embed] });

    }
}