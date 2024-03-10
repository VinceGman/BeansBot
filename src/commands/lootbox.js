// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
}); // firestore credentials

const comma_adder = require('commas');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'lootbox',
    alias: ['cook', 'lb'],
    description: "rolls for 20000 collectibles",
    category: 'cards',
    admin: false,
    type: "production",
    cooldown: 60,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let db_user = await require('../utility/queries').user(msg.author.id);
        let lootbox_total_cards = db_user?.lootbox_total_cards ? +db_user.lootbox_total_cards : 0;
        let lootbox_total_cards_limit = db_user?.lootbox_total_cards_limit ? +db_user.lootbox_total_cards_limit : 100; // if not there, 200
        let lootbox_flips_per_hour = db_user?.lootbox_flips_per_hour ? +db_user.lootbox_flips_per_hour : 0;
        let lootbox_flips_timestamp = db_user?.lootbox_flips_timestamp ? +db_user.lootbox_flips_timestamp : 0;

        let lootbox_epic_chance = db_user?.lootbox_epic_chance ? +db_user.lootbox_epic_chance : 30; // +10
        let lootbox_legendary_chance = db_user?.lootbox_legendary_chance ? +db_user.lootbox_legendary_chance : 10; // +10
        let lootbox_ultimate_chance = db_user?.lootbox_ultimate_chance ? +db_user.lootbox_ultimate_chance : 1; // +10

        let current_time_in_seconds = Math.floor(Date.now() / 1000);
        if ((current_time_in_seconds - lootbox_flips_timestamp) >= 3600) {
            lootbox_flips_per_hour = 0;
            lootbox_flips_timestamp = Math.trunc((current_time_in_seconds - (current_time_in_seconds % 3600)));
        }

        if (lootbox_total_cards >= lootbox_total_cards_limit) {
            msg.channel.send(`${msg.author.username} - You've hit your lootbox card holding limit. To get more -> **+upgrade**`);
            return;
        }

        let lootbox_flips_per_hour_limit = 15;
        let card_cost = Math.floor((lootbox_flips_per_hour) / lootbox_flips_per_hour_limit) * 5000;
        card_cost = card_cost == 0 ? 1000 : card_cost;


        if ((lootbox_flips_per_hour + 1) % lootbox_flips_per_hour_limit == 0) {
            msg.reply(`Your cards cost ${comma_adder.add(Math.floor((lootbox_flips_per_hour + 1) / lootbox_flips_per_hour_limit) * 5000)} credits for the rest of the hour. Reset -> <t:${lootbox_flips_timestamp + 3600}:R>`);
        }

        if (!(await require('../utility/credits').transaction(discord_client, msg, card_cost))) return; // credits manager validates transaction

        let roll_num = Math.floor(Math.random() * 20000) + 1; // [1, 20000]
        try {
            var character = (await db.collection('anime_cards').where(`${msg.guildId}_owned`, "==", false).where("rank", ">=", roll_num).orderBy("rank", "asc").limit(1).get())?._docs()?.[0]?.data(); // retrieve character from database
            if (!character) throw 'no character';
        }
        catch (err) {
            msg.channel.send(`${msg.author.username} - System Error: Anime API Failed`);
            await require('../utility/credits').refund(discord_client, msg.author.id, card_cost); // credits manager refunds on error
            return;
        }


        let success = true;
        let rolling_msg;
        let chance;
        if (['Epic', 'Legendary', 'Ultimate'].includes(character.rarity)) {
            let unlock_roll_num = Math.floor(Math.random() * 100) + 1; // [1, 100]

            switch (character.rarity) {
                case 'Epic':
                    chance = lootbox_epic_chance;
                    if (unlock_roll_num > lootbox_epic_chance) {
                        success = false;
                        lootbox_epic_chance += 10;
                    }
                    else {
                        lootbox_epic_chance = 30;
                    }
                    break;
                case 'Legendary':
                    chance = lootbox_legendary_chance;
                    if (unlock_roll_num > lootbox_legendary_chance) {
                        success = false;
                        lootbox_legendary_chance += 10;
                    }
                    else {
                        lootbox_legendary_chance = 10;
                    }
                    break;
                case 'Ultimate':
                    chance = lootbox_ultimate_chance;
                    if (unlock_roll_num > lootbox_ultimate_chance) {
                        success = false;
                        lootbox_ultimate_chance += 10;
                    }
                    else {
                        lootbox_ultimate_chance = 1;
                    }
                    break;
            }

            rolling_msg = await this.rolling_embed(msg, character, 'pending', chance);
        }

        if (success) {
            try {
                character[`${msg.guildId}_owner_id`] = msg.author.id.toString();
                character[`${msg.guildId}_owned`] = true;
                if (character[`${msg.guildId}_locked`]) {
                    character[`${msg.guildId}_locked`] = false;
                }
                const res = await db.collection('anime_cards').doc(`${character.rank_text}`).update(character);
            }
            catch (err) {
                msg.channel.send(`${msg.author.username} - System Error: Database Failed - Logging Card Changes`);
                await require('../utility/credits').refund(discord_client, msg.author.id, card_cost); // credits manager refunds on error
                return;
            }

            lootbox_total_cards += 1;
        }

        lootbox_flips_per_hour += 1;

        try {
            await db.doc(`members/${msg.author.id}`).set({
                lootbox_total_cards: lootbox_total_cards.toString(),
                lootbox_flips_per_hour: lootbox_flips_per_hour.toString(),
                lootbox_flips_timestamp: lootbox_flips_timestamp.toString(),
                lootbox_epic_chance: lootbox_epic_chance.toString(),
                lootbox_legendary_chance: lootbox_legendary_chance.toString(),
                lootbox_ultimate_chance: lootbox_ultimate_chance.toString(),
            }, { merge: true });
        }
        catch (err) {
            msg.channel.send(`${msg.author.username} - System Error: Database Failed - Logging User Changes`);
            return;
        }

        if (rolling_msg) {
            await new Promise(r => setTimeout(r, 6000));
            if (success) {
                rolling_msg.edit({ embeds: [await require('../utility/embeds').make_card_embed(discord_client, msg, character)] });
            }
            else {
                rolling_msg.edit(await this.rolling_embed(msg, character, 'failure', chance));
            }
        }
        else {
            require('../utility/embeds').print_lootbox(msg, character);
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