const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'delist',
    description: "take a card off the market",
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        if (args.length == 0) {
            let delist_guide = new MessageEmbed()
                .setTitle(`Delist Guide`)
                .setDescription('If you no longer wish to sell a card, delist it. Note: using +sell on a card again will change the listing price without needing to delist.')
                .setColor('#000000')
                .addField('+delist Nezuko Kamado', `delists card 'Nezuko Kamado' from the market`, false)
                .addField('+delist 123', `delists card with rank #123 from the market`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [delist_guide] });
            return;
        }

        // database: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown
        let character = await require('../utility/queries').owned_character(msg, args);
        if (!character) return;

        const res = await db.doc(`edition_one/${character['rank_text'][character['rank_text'].valueType]}`).update({
            for_sale: false,
            selling_price: 0,
        }).catch(err => msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - This product wasn't stored properly. Please contact Sore#1414.`));

        msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Delisted ${character.name.stringValue}.`);
    }
}