module.exports = {
    name: 'sell',
    description: "sell cards on the market",
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        // database: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        if (args.length == 0) {
            let sell_guide = new MessageEmbed()
                .setTitle(`Sell Guide`)
                .setDescription('To ensure you sell the product you intend, use the exact name or rank.')
                .setColor('#000000')
                .addField('+sell Nezuko Kamado 10000', `lists card 'Nezuko Kamado' at 10000 credits on the market`, false)
                .addField('+sell 123 10000', `lists card with rank #123 at 10000 credits on the market`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [sell_guide] });
            return;
        }

        let price = args.pop();
        if (isNaN(price) || price < 0 || price >= 1000000) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - +sell <name> <price>`);
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown
        let character = await require('../utility/queries').owned_character(msg, args);
        if (!character) return;

        const res = await db.doc(`edition_one/${character['rank_text'][character['rank_text'].valueType]}`).update({
            for_sale: true,
            selling_price: +price,
        }).catch(err => msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - This product wasn't stored properly. Please contact Sore#1414.`));

        msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Listed ${character.name.stringValue} for ${price} on the market.`);
    }
}