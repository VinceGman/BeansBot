// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const comma_adder = require('commas');

module.exports = {
    description: "purge your cards",
    category: 'cards',
    admin: false,
    cooldown: 60,
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


        let cards = [];
        try { cards.push(...(await db.collection(`anime_cards`).where(`${msg.guildId}_owner_id`, '==', msg.author.id).where(`${msg.guildId}_protected`, '==', false).where('stars', 'in', stars_purge).get())._docs()); } catch (err) { }
        try { cards.push(...(await db.collection(`anime_cards`).where(`${msg.guildId}_owner_id`, '==', msg.author.id).where(`${msg.guildId}_protected`, '==', false).where(`${msg.guildId}_locked`, '==', true).where('locked_id', 'in', lockedId_purge).get())._docs()); } catch (err) { }
        try { cards.push(...(await db.collection(`anime_cards`).where(`${msg.guildId}_owner_id`, '==', msg.author.id).where(`${msg.guildId}_protected`, '==', false).where(`${msg.guildId}_locked`, '==', false).where('rank_text', 'in', rankText_purge).get())._docs()); } catch (err) { }
        cards = cards.map(card => card.data());

        let _ = require('lodash');

        if (cards.length >= 10) {
            var warning_msg = await msg.reply('Purging cards. Please wait, it may take a moment.');
        }

        for (let card of cards) {
            switch (card.rarity) {
                case 'Common':
                    break;
                case 'Uncommon':
                    break;
                case 'Rare':
                    break;
                case 'Epic':
                    break;
                case 'Legendary':
                    break;
                case 'Ultimate':
                    break;
                default:
            }


            await this.return_card(card, msg);
        };

        await require('../utility/credits').refund(discord_client, msg.author.id, refund_value); // credits manager refunds on error
        await require('../utility/data_management').update_user_card_count(msg.author.id, cards.length * -1);
        await require('../utility/credits').refund(discord_client, msg, msg.author.id, total_refund_value); // credits manager refunds on error
        await require('../utility/data_management').update_user_card_count(msg.guildId, msg.author.id, cards.length * -1);

        if (warning_msg) warning_msg.delete();

        let pay_result = new EmbedBuilder()
            .setTitle(`Purge Payment`)
            .setColor('#37914f')
            .addFields({ name: `Purged`, value: `${cards.length} ${cards.length == 1 ? 'card' : 'cards'}`, inline: true })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [pay_result] });
        require('../utility/timers').reset_timer(msg, this.name); // release resource
        return;
    },
    async return_card(card, msg) {
        let color = '#FFFFFF';
        let rarity = 'Common';
        let stars = '★';

        if (card.rank <= 20) {
            color = '#fc5d65';
            rarity = 'Ultimate';
            stars = '★★★★★★';
        }
        else if (card.rank <= 200) {
            color = '#ffab4b';
            rarity = 'Legendary';
            stars = '★★★★★';
        }
        else if (card.rank <= 800) {
            color = '#c369ec';
            rarity = 'Epic';
            stars = '★★★★';
        }
        else if (card.rank <= 2000) {
            color = '#0070DD';
            rarity = 'Rare';
            stars = '★★★';
        }
        else if (card.rank <= 8000) {
            color = '#7aaf74';
            rarity = 'Uncommon';
            stars = '★★';
        }

        const res = await db.doc(`anime_cards/${card.rank_text}`).update({
            [`${msg.guildId}_owner_id`]: '',
            [`${msg.guildId}_owned`]: false,
            [`${msg.guildId}_protected`]: false,
            [`${msg.guildId}_locked`]: card.locked_id ? true : false,
            color: color,
            rarity: rarity,
            stars: stars,
        }).catch(err => msg.channel.send(`${msg.author.username} - This product wasn't purged properly. Please contact Sore#1414. Rank: ${card.rank_text}`));
    }
}