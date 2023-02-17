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
                if (price) {
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
    async stock_chart(msg, stocks) {
        const ChartJSImage = require('chart.js-image');
        const randomColor = require('randomcolor');

        let colors = randomColor({
            luminosity: 'bright',
            hue: 'random',
            count: stocks.length
        });

        const chart_options = {
            "type": "line",
            "data": { "labels": [], "datasets": [] },
            "options": {
                "title": {
                    "display": true,
                    "text": `Stock Graph`
                },
                "scales": {
                    "xAxes": [
                        {
                            "scaleLabel": {
                                "display": true,
                                "labelString": "Time Period"
                            }
                        }
                    ],
                    "yAxes": [
                        {
                            "stacked": true,
                            "scaleLabel": {
                                "display": true,
                                "labelString": "Price"
                            }
                        }
                    ]
                }
            }
        }

        const { MessageEmbed } = require('discord.js');
        const stocks_embed = new MessageEmbed();

        for (let entry in stocks) {
            const alpha = require('alphavantage')({ key: process.env.alpha_vantage_key });
            let meta = await alpha.crypto.daily(stocks[entry].real_stock.split('-')[0].trim().toLowerCase(), 'usd');
            let hist_data = meta['Time Series (Digital Currency Daily)'];

            const coinlore_client = new (require('coinlore-crypto-prices'))();
            let price = (await coinlore_client.getTicker(stocks[entry].id))[0]?.price_usd;
            if (price) {
                stocks_embed.addField(`${stocks[entry].symbol} - Open Shares: ${stocks[entry].public}`, `${((+price / +stocks[entry].base_price) * 1000).toFixed(2)}`, false);
            }

            let labels = [];
            let datasets = [];

            for (let date in hist_data) {
                labels.push(`${date.split('-')[1]}-${date.split('-')[2]}`);
                datasets.push((((+hist_data[date]['1a. open (USD)'] + +hist_data[date]['4a. close (USD)'] + +hist_data[date]['2a. high (USD)'] + +hist_data[date]['3a. low (USD)']) / 4) / stocks[entry].base_price * 1000).toFixed(2));
            }

            const _ = require("lodash");

            labels = _.reverse(labels.slice(0, 60));
            datasets = _.reverse(datasets.slice(0, 60))

            chart_options.data.labels = labels;
            chart_options.data.datasets.push({
                "label": stocks[entry].symbol,
                "borderColor": colors[entry],
                "backgroundColor": '#000000',
                "data": datasets
            });
        }

        const line_chart = ChartJSImage().chart(chart_options)
            .backgroundColor('black')
            .width(960)
            .height(540);

        let file_path = `images/${msg.author.id}_stocks.png`;
        await line_chart.toFile(file_path)

        stocks_embed.setTitle('Stocks').setImage(`attachment://${msg.author.id}_stocks.png`);
        await msg.channel.send({ embeds: [stocks_embed], files: [file_path] });

        fs.unlinkSync(file_path);
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