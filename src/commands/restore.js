// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const comma_adder = require('commas');

module.exports = {
    name: 'restore',
    alias: ['fix'],
    description: "restore a card's image",
    category: 'cards',
    admin: false,
    type: "production",
    cooldown: 2,
    async execute(discord_client, msg, args, admin) {
        const { EmbedBuilder } = require('discord.js');

        if (args.length == 0) {
            let restore_guide = new EmbedBuilder()
                .setTitle(`Restore Guide`)
                .setColor('#000000')
                .setDescription(`Restore a card's image if it's not showing. You'll receive 100,000 credits.`)
                .addFields({ name: '+restore 123', value: `restores image of card with rank #123`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [restore_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        if (args.length != 1 || isNaN(args[0].replace('#', ''))) {
            msg.channel.send(`${msg.author.username} - You must type a single card rank.`);
            return;
        }

        try {
            var character = (await db.collection(`anime_cards`).where('rank_text', '==', args[0].replace('#', '')).get())._docs()[0].data();
            if (!character) throw 'null character';
        }
        catch (err) {
            msg.channel.send(`${msg.author.username} - No character found.`);
            return;
        }

        try {
            const { Character } = require("@shineiichijo/marika");
            const charaClient = new Character();

            var new_image_link = (await charaClient.getCharacterById(character.mal_id)).images.jpg.image_url;
        }
        catch (err) {
            msg.channel.send(`${msg.author.username} - Anime API Failed`);
            return;
        }

        if (character.image == new_image_link) {
            msg.channel.send(`${msg.author.username} - It appears this card didn't need restoring.`);
            return;
        }

        const res = await db.doc(`anime_cards/${character.rank_text}`).update({
            image: new_image_link,
        }).catch(err => msg.channel.send(`${msg.author.username} - This product wasn't restored properly. Please contact Sore#1414.`));

        character.image = new_image_link;
        msg.channel.send({ embeds: [await require('../utility/embeds').make_card_embed(discord_client, msg, character)] });

        await require('../utility/credits').refund(discord_client, msg, msg.author.id, 100000); // credits manager refunds on error

        let pay_result = new EmbedBuilder()
            .setTitle(`Restore Payment`)
            .setColor('#37914f')
            .setDescription(`Thank you for restoring this card!`)
            .addFields({ name: `Recipient`, value: `${(await msg.guild.members.fetch(msg.author.id)).user.username}`, inline: true })
            .addFields({ name: `Amount`, value: `+${comma_adder.add(Math.trunc(100000))} credits`, inline: true })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [pay_result] });
        return;
    }
}