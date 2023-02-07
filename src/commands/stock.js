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
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown
        let options = require('../utility/parsers').parse_command(msg, this.name, this.alias);

        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
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
                    stocks_embed.addField(`${stock.symbol} - Open Shares: ${stock.public}`, `${((+price/+stock.base_price) * 1000).toFixed(2)}`, false);
                }
            }

            msg.channel.send({ embeds: [stocks_embed] });
            return;
        }

        // if (options.includes('s')) {
        //     await this.stock_chart(msg, [{ symbol: 'ETH' }, { symbol: 'BTC' }]);
        // }
        // else {
        //     if (args.length > 0) {
        //         let stocks = [];
        //         for (let stock of args) {
        //             stocks.push({ symbol: stock });
        //         }
        //         await this.stock_chart(msg, stocks);
        //     }
        // }

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
                    "text": `My Portfolio: ${msg.author.username}#${msg.author.discriminator}`
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
            let meta = await alpha.crypto.daily(stocks[entry].symbol, 'usd');
            let hist_data = meta['Time Series (Digital Currency Daily)'];

            let stock_symbol = meta['Meta Data']?.['2. Digital Currency Code'] ?? 'N/A';

            if (stock_symbol == 'N/A') {
                console.log(Object.keys(meta));
            }

            const rate = await alpha.forex.rate(stock_symbol, 'usd');
            let stock_price = +rate['Realtime Currency Exchange Rate']?.['5. Exchange Rate'] ?? 0;

            if (stock_price == 0) {
                console.log(Object.keys(rate));
            }

            stock_price = +stock_price < 1 ? `${stock_price}` : `${stock_price.toFixed(2)}`;

            stocks_embed.addField(stock_symbol, stock_price, false);

            let labels = [];
            let datasets = [];

            for (let date in hist_data) {
                labels.push(`${date.split('-')[1]}-${date.split('-')[2]}`);
                datasets.push(((+hist_data[date]['1a. open (USD)'] + +hist_data[date]['4a. close (USD)'] + +hist_data[date]['2a. high (USD)'] + +hist_data[date]['3a. low (USD)']) / 4).toFixed(2));
            }

            const _ = require("lodash");

            labels = _.reverse(labels.slice(0, 60));
            datasets = _.reverse(datasets.slice(0, 60))

            chart_options.data.labels = labels;
            chart_options.data.datasets.push({
                "label": stock_symbol,
                "borderColor": colors[entry],
                "backgroundColor": '#000000',
                "data": datasets
            });
        }

        const line_chart = ChartJSImage().chart(chart_options)
            .backgroundColor('black')
            .width(600)
            .height(338);

        let file_path = `images/${msg.author.id}_stocks.png`;
        await line_chart.toFile(file_path)

        stocks_embed.setTitle('Stocks').setImage(`attachment://${msg.author.id}_stocks.png`);
        await msg.channel.send({ embeds: [stocks_embed], files: [file_path] });

        fs.unlinkSync(file_path);
    }
}