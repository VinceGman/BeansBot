const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'buy',
    description: "buy cards on the market",
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        if (args.length == 0) {
            let buy_guide = new MessageEmbed()
                .setTitle(`Buy Guide`)
                .setDescription('To ensure you get the product you want, use the exact name or rank.')
                .setColor('#000000')
                .addField('+buy Nezuko Kamado', `buys card 'Nezuko Kamado' at market price`, false)
                .addField('+buy 123', `buys card with rank #123 at market price`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [buy_guide] });
            return;
        }

        // database: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let character = (await require('../utility/queries').character(msg, args, 1))[0];
        if (!character) return;

        if (character.owner_id.stringValue == msg.author.id) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Can't buy your own card.`);
            return;
        }
        else if (!character.for_sale.booleanValue) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Card: #${character.rank_text.stringValue} is not for sale.`);
            return;
        }

        if (!(await require('../utility/credits').transaction(msg, +character.selling_price.integerValue))) return; // credits manager validates transaction
        await require('../utility/credits').refund(character.owner_id.stringValue, +character.selling_price.integerValue); // credits manager refunds

        const res = await db.doc(`edition_one/${character['rank_text'][character['rank_text'].valueType]}`).update({
            owner_id: msg.author.id,
            for_sale: false,
            selling_price: 0,
        }).catch(err => msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - This product wasn't stored properly. Please contact Sore#1414.`));

        msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Purchased ${character.name.stringValue} for ${character.selling_price.integerValue} on the market.`);
    }
}