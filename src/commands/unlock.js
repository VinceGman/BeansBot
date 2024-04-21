
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'unlock',
    description: "unlock a card",
    category: 'cards',
    admin: false,
    type: "production",
    cooldown: 7,
    async execute(discord_client, msg, args, admin) {
        if (args.length == 0) {
            let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
            let lootbox_legendary_chance = db_user?.lootbox_legendary_chance ? +db_user.lootbox_legendary_chance : 10; // +10
            let lootbox_ultimate_chance = db_user?.lootbox_ultimate_chance ? +db_user.lootbox_ultimate_chance : 1; // +10

            let unlock_guide = new EmbedBuilder()
                .setTitle(`Unlock Guide`)
                .setDescription(`Unlock a locked card with chance.`)
                .setColor('#000000')
                .addFields({ name: '+unlock 001123', value: `Chance to unlock card with ID: 001123`, inline: false })
                .addFields({ name: 'Legendary', value: `${lootbox_legendary_chance}% chance`, inline: false })
                .addFields({ name: 'Ultimate', value: `${lootbox_ultimate_chance}% chance`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [unlock_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let character = await require('../utility/queries').owned_character(msg, args);
        if (!character) return;

        if (character[`${msg.guildId}_locked`] == false) {
            msg.channel.send(`${msg.author.username} - No character found.`);
            return;
        }

        let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);
        let lootbox_total_cards = db_user?.lootbox_total_cards ? +db_user.lootbox_total_cards : 0;
        let lootbox_legendary_chance = db_user?.lootbox_legendary_chance ? +db_user.lootbox_legendary_chance : 10; // +10
        let lootbox_ultimate_chance = db_user?.lootbox_ultimate_chance ? +db_user.lootbox_ultimate_chance : 1; // +10

        let success = false;
        let chance;
        let unlock_roll_num = Math.floor(Math.random() * 100) + 1; // [1, 100]

        switch (character.rarity) {
            case 'Legendary':
                chance = lootbox_legendary_chance;
                if (unlock_roll_num <= lootbox_legendary_chance) {
                    success = true;
                    lootbox_legendary_chance = 10;
                }
                else {
                    lootbox_legendary_chance += 10;
                }
                break;
            case 'Ultimate':
                chance = lootbox_ultimate_chance;
                if (unlock_roll_num <= lootbox_ultimate_chance) {
                    success = true;
                    lootbox_ultimate_chance = 1;
                }
                else {
                    lootbox_ultimate_chance += 10;
                }
                break;
        }

        let rolling_msg = await this.rolling_embed(msg, character, 'pending', chance);

        if (success) {
            try {
                character[`${msg.guildId}_locked`] = false;
                const res = await db.collection('anime_cards').doc(`${character.rank_text}`).update(character);
            }
            catch (err) {
                msg.channel.send(`${msg.author.username} - System Error: Database Failed - Logging Card Changes`);
                return;
            }
        }
        else {
            require('../commands/purge').return_card(character, msg);
            lootbox_total_cards -= 1;
        }

        try {
            await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({
                lootbox_total_cards: lootbox_total_cards.toString(),
                lootbox_legendary_chance: lootbox_legendary_chance.toString(),
                lootbox_ultimate_chance: lootbox_ultimate_chance.toString(),
            }, { merge: true });
        }
        catch (err) {
            msg.channel.send(`${msg.author.username} - System Error: Database Failed - Logging User Changes`);
            return;
        }

        await new Promise(r => setTimeout(r, 6000));
        if (success) {
            rolling_msg.edit({ embeds: [await require('../utility/embeds').make_card_embed(discord_client, msg, character)] });
        }
        else {
            rolling_msg.edit(await this.rolling_embed(msg, character, 'failure', chance));
        }

        require('../utility/timers').reset_timer(msg, this.name); // release resource
    },
    async rolling_embed(msg, character, stage, chance) {
        let rolling_embed = new EmbedBuilder();

        switch (stage) {
            case 'pending':
                rolling_embed
                    .addFields({ name: 'Roll', value: `Pending...`, inline: true })
                    .addFields({ name: 'Chance', value: `${chance}%`, inline: true })
                    .setImage(`https://cdn.discordapp.com/attachments/1185611459921711134/1216158640860565634/lock_bg.gif?ex=65ff5eff&is=65ece9ff&hm=17d77b11d56c8856071871853627b17560425edd081be9d6b6324eae2f05cffe&`)
                    .setColor(character.color)
                    .setFooter({ text: 'Beans - ACC' })
                    .setTimestamp();

                let pending_msg = await msg.channel.send({ embeds: [rolling_embed] });
                return pending_msg;
                break;
            case 'failure':
                rolling_embed
                    .addFields({ name: 'Roll', value: `Failure`, inline: true })
                    .addFields({ name: 'Chance', value: `${chance}% -> ${chance + 10}%`, inline: true })
                    .setImage(`https://cdn.discordapp.com/attachments/1185611459921711134/1216158641929851020/lock_closed.png?ex=65ff5eff&is=65ece9ff&hm=a6cbd262c181c09a1d63c4a7448c196ce43d22404a9b12cddc4508afd0d565fb&`)
                    .setColor(character.color)
                    .setFooter({ text: 'Beans - ACC' })
                    .setTimestamp();

                return { embeds: [rolling_embed] }
                break;
        }
    }
}