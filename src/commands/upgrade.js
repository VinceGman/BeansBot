
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'upgrade',
    alias: ['upgrades'],
    alias_show: [],
    description: "upgrade a piece of your account",
    category: 'utility',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        if (args.length == 0) {
            this.upgrade_guide(msg);
            return;
        }
        else if (args[0].toLowerCase() == 'income') {
            let cost = 1000000;
            if (!(await require('../utility/credits').transaction(discord_client, msg, cost))) return; // credits manager validates transaction

            let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
            let income_max_charges = db_user?.income_max_charges ? +db_user.income_max_charges : 6;

            income_max_charges += 1;

            await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
                income_max_charges: income_max_charges.toString(),
            }, { merge: true });

            let upgrade_embed = new EmbedBuilder()
                .setTitle(`Upgrade`)
                .setDescription(`Increased Income Charges`)
                .setColor('#000000')
                .addFields({ name: 'Income Charges', value: `${income_max_charges - 1} -> **${income_max_charges}** charges`, inline: false })
                .addFields({ name: 'Cost', value: `1,000,000 credits`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [upgrade_embed] });
            return;
        }
        else if (args[0].toLowerCase() == 'inventory') {
            let cost = 1000000;
            if (!(await require('../utility/credits').transaction(discord_client, msg, cost))) return; // credits manager validates transaction

            let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
            let lootbox_total_cards_limit = db_user?.lootbox_total_cards_limit ? +db_user.lootbox_total_cards_limit : 100; // if not there, 200

            lootbox_total_cards_limit += 100;

            await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
                lootbox_total_cards_limit: lootbox_total_cards_limit.toString(),
            }, { merge: true });

            let upgrade_embed = new EmbedBuilder()
                .setTitle(`Upgrade`)
                .setDescription(`Increased Card Inventory`)
                .setColor('#000000')
                .addFields({ name: 'Card Inventory Limit', value: `${lootbox_total_cards_limit - 100} -> **${lootbox_total_cards_limit}** cards`, inline: false })
                .addFields({ name: 'Cost', value: `1,000,000 credits`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [upgrade_embed] });
            return;
        }
        else if (args.join(' ').toLowerCase().includes('wish chance')) {
            let cost = 1000000;
            if (!(await require('../utility/credits').transaction(discord_client, msg, cost))) return; // credits manager validates transaction

            let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
            let wish_chance = db_user?.wish_chance ? +db_user.wish_chance : 5;

            wish_chance += 2;

            await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
                wish_chance: wish_chance.toString(),
            }, { merge: true });

            let upgrade_embed = new EmbedBuilder()
                .setTitle(`Upgrade`)
                .setDescription(`Increased Wish Chance`)
                .setColor('#000000')
                .addFields({ name: 'Wish Chance Multiplier', value: `${((wish_chance - 2)*2)}x -> **${(wish_chance * 2)}x**`, inline: false })
                .addFields({ name: 'Cost', value: `1,000,000 credits`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [upgrade_embed] });
            return;
        }
        else if (args.join(' ').toLowerCase().includes('wishlist size')) {
            let cost = 1000000;
            if (!(await require('../utility/credits').transaction(discord_client, msg, cost))) return; // credits manager validates transaction

            let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
            let wishlist_max_size = db_user?.wishlist_max_size ? +db_user.wishlist_max_size : 5;

            wishlist_max_size += 1;

            await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
                wishlist_max_size: wishlist_max_size.toString(),
            }, { merge: true });

            let upgrade_embed = new EmbedBuilder()
                .setTitle(`Upgrade`)
                .setDescription(`Increased Wishlist Size`)
                .setColor('#000000')
                .addFields({ name: 'Wishlist Max Size', value: `${wishlist_max_size - 1} -> **${wishlist_max_size}** wishes`, inline: false })
                .addFields({ name: 'Cost', value: `1,000,000 credits`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [upgrade_embed] });
            return;
        }
        else {
            this.upgrade_guide(msg);
            return;
        }
    },
    async upgrade_guide(msg) {
        let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
        let lootbox_total_cards_limit = db_user?.lootbox_total_cards_limit ? +db_user.lootbox_total_cards_limit : 100; // if not there, 200
        let income_max_charges = db_user?.income_max_charges ? +db_user.income_max_charges : 6;
        let wishlist_max_size = db_user?.wishlist_max_size ? +db_user.wishlist_max_size : 5;
        let wish_chance = db_user?.wish_chance ? +db_user.wish_chance : 5;

        let upgrade_guide = new EmbedBuilder()
            .setTitle(`Upgrade Guide`)
            .setDescription(`Upgrade a piece of your account. Cost: 1,000,000 credits`)
            .setColor('#000000')
            .addFields({ name: '+upgrade income', value: `Increases your total income charges by 1\nCurrent: ${income_max_charges} charges`, inline: false })
            .addFields({ name: '+upgrade inventory', value: `Increases your card inventory limit by 100\nCurrent: ${lootbox_total_cards_limit} cards`, inline: false })
            .addFields({ name: '+upgrade wish chance', value: `Increases your wish chance by 4x\nCurrent: ${(wish_chance * 2)}x`, inline: false })
            .addFields({ name: '+upgrade wishlist size', value: `Increases your wishlist size by 1\nCurrent: ${wishlist_max_size} wishes`, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [upgrade_guide] });
    }
}