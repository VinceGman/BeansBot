// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'give',
    alias: ['gift'],
    description: "give someone a card",
    category: 'cards',
    admin: false,
    type: "test",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        const { EmbedBuilder } = require('discord.js');

        if (args.length == 0) {
            let give_guide = new EmbedBuilder()
                .setTitle(`Give Guide`)
                .setDescription(`You can (forcefully) give someone a card. You must mention the user you'd like to gift anywhere in the message.`)
                .setColor('#000000')
                .addFields({ name: '+give @Sore Eren Yeager', value: `gives the card with name 'Eren Yeager' to Sore.`, inline: false })
                .addFields({ name: '+give @Sore 47', value: `gives the card with rank #47 to Sore.`, inline: false })
                .addFields({ name: '+give @Sore 001123', value: `gives the card with ID:001123 to Sore.`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [give_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        if (msg.mentions.users.size != 1) {
            msg.channel.send(`${msg.author.username} - **+give** for more info.`);
            return;
        }

        let recipient = msg.mentions.users.keys().next().value;
        if (recipient == msg.author.id) {
            msg.channel.send(`${msg.author.username} - All you do is take and take... **+give** for more info.`);
            return;
        }

        args = args.filter(a => !a.includes('<@'));

        let character = await require('../utility/queries').owned_character(msg, args);
        if (!character) return;

        require('../utility/data_management').update_user_card_count(msg.author.id, -1);
        require('../utility/data_management').update_user_card_count(recipient, 1);

        const res = await db.collection('anime_cards').doc(`${character.rank_text}`).update({ // updates owner_id on character_ref card in database
            [`${msg.guildId}_owner_id`]: recipient,
            [`${msg.guildId}_protected`]: true,
        }).catch(err => msg.channel.send(`${msg.author.username} - This product wasn't given properly. Please contact Sore#1414.`));

        msg.channel.send(`${msg.author.username} - Card given and protected.`);
    }
}