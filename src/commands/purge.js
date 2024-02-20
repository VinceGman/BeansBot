// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'purge',
    description: "purge your cards",
    category: 'cards',
    admin: false,
    type: "test",
    cooldown: 2,
    async execute(discord_client, msg, args, admin) {
        const { EmbedBuilder } = require('discord.js');

        if (args.length == 0) {
            let purge_guide = new EmbedBuilder()
                .setTitle(`Purge Guide`)
                .setDescription('This is how you get rid of cards. No purge can be undone. Read carefully. Protected cards are unaffected.')
                .setColor('#000000')
                .addFields({ name: '+purge **1**', value: `purges all **1 star cards** (number 1 to 6)`, inline: false })
                .addFields({ name: '+purge **123**  |  +purge **#123**', value: `purges card with **rank #123**`, inline: false })
                .addFields({ name: '+purge **001123**', value: `purges card with **ID:001123**`, inline: false })
                .addFields({ name: '+purge **1 3 123 001123**', value: `purges all **1 stars**, **3 stars**, **rank 123** and **ID:001123**`, inline: false })
                .addFields({ name: '+purge **all**', value: `purges **all** cards in your inventory that **aren't** protected`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [purge_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let stars_purge = [];
        let lockedId_purge = [];
        let rankText_purge = [];

        for (let arg of args) {
            if (arg.length == 6 && !isNaN(arg)) {
                lockedId_purge.push(arg);
            }
            else if (arg.includes('#') || (arg.length <= 5 && !isNaN(arg) && +arg >= 7 && +arg <= 20000)) {
                rankText_purge.push(arg.replace('#', ''))
            }
            else if (arg.length == 1 && !isNaN(arg) && +arg <= 6) {
                let stars = '';
                for (let i = 0; i < +arg; i++) {
                    stars += '★';
                }
                stars_purge.push(stars);
            }
            else if (arg.toLowerCase() == 'all') {
                stars_purge = ['★', '★★', '★★★', '★★★★', '★★★★★', '★★★★★★'];
            }
        }


        console.log(stars_purge, lockedId_purge, rankText_purge);

        let cards = [];
        try { cards.push(...(await db.collection(`anime_cards`).where(`${msg.guildId}_owner_id`, '==', msg.author.id).where(`${msg.guildId}_protected`, '==', false).where('stars', 'in', stars_purge).get())._docs()); } catch (err) { }
        try { cards.push(...(await db.collection(`anime_cards`).where(`${msg.guildId}_owner_id`, '==', msg.author.id).where(`${msg.guildId}_protected`, '==', false).where(`${msg.guildId}_locked`, '==', true).where('locked_id', 'in', lockedId_purge).get())._docs()); } catch (err) { }
        try { cards.push(...(await db.collection(`anime_cards`).where(`${msg.guildId}_owner_id`, '==', msg.author.id).where(`${msg.guildId}_protected`, '==', false).where(`${msg.guildId}_locked`, '==', false).where('rank_text', 'in', rankText_purge).get())._docs()); } catch (err) { }
        cards = cards.map(card => card.data());

        let _ = require('lodash');
        cards = _.uniqBy(cards, 'rank_text');

        if (cards.length >= 15) {
            var warning_msg = await msg.reply('Purging cards. Please wait, it may take a moment.');
        }

        for (let card of cards) {
            await this.return_card(card, msg);
        };

        require('../utility/data_management').update_user_card_count(msg.author.id, cards.length * -1);

        if (warning_msg) warning_msg.delete();
        msg.channel.send(`${msg.author.username} - ${cards.length} ${cards.length == 1 ? 'card' : 'cards'} purged.`);
    },
    async return_card(card, msg) {
        const res = await db.doc(`anime_cards/${card.rank_text}`).update({
            [`${msg.guildId}_owner_id`]: '',
            [`${msg.guildId}_owned`]: false,
            [`${msg.guildId}_protected`]: false,
            [`${msg.guildId}_locked`]: card.locked_id ? true : false,
        }).catch(err => msg.channel.send(`${msg.author.username} - This product wasn't purged properly. Please contact Sore#1414. Rank: ${card.rank_text}`));
    }
}