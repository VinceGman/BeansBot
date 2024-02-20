
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'unlock',
    description: "unlock a card",
    category: 'cards',
    admin: false,
    type: "test",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        const { EmbedBuilder } = require('discord.js');

        if (args.length == 0) {
            let unlock_guide = new EmbedBuilder()
                .setTitle(`Unlock Guide`)
                .setDescription(`Unlock a locked card for a price.`)
                .setColor('#000000')
                .addFields({ name: '+unlock 001123', value: `Unlocks card with Locked ID: 001123`, inline: false })
                .addFields({ name: 'Legendary', value: `1,000,000 credits`, inline: false })
                .addFields({ name: 'Ultimate', value: `10,000,000 credits`, inline: false })
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

        let cost = character.rarity == 'Ultimate' ? 10000000 : 1000000

        if (!(await require('../utility/credits').transaction(discord_client, msg, cost))) return; // credits manager validates transaction

        const res = await db.doc(`anime_cards/${character.rank_text}`).update({
            [`${msg.guildId}_locked`]: false,
        }).catch(err => msg.channel.send(`${msg.author.username} - This product wasn't unlocked properly. Please contact Sore#1414.`));

        character[`${msg.guildId}_locked`] = false;
        msg.channel.send({ embeds: [await require('../utility/embeds').make_card_embed(discord_client, msg, character)] });
    }
}