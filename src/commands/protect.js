
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'protect',
    description: "protect a card",
    category: 'cards',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        const { EmbedBuilder } = require('discord.js');

        if (args.length == 0) {
            let protect_guide = new EmbedBuilder()
                .setTitle(`Protect Guide`)
                .setDescription(`Protected cards aren't affected by **+purge**.`)
                .setColor('#000000')
                .addFields({ name: '+protect 123', value: `protects card with rank #123`, inline: false })
                .addFields({ name: '+protect 001123', value: `protects card with ID: 001123`, inline: false })
                .addFields({ name: '+protect Nezuko Kamado', value: `protects card with name 'Nezuko Kamado'`, inline: false })
                .addFields({ name: '+protect all', value: `protects all unprotected cards in your inventory`, inline: false })
                .addFields({ name: '+protect none', value: `unprotects all protected cards in your inventory`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [protect_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        try {
            if (args.length == 1 && args[0].toLowerCase() == 'all') {
                let count = 0;
                let characters = (await db.collection(`anime_cards`).where(`${msg.guildId}_owner_id`, '==', msg.author.id).where(`${msg.guildId}_protected`, '==', false).get())._docs();
                if (characters.length == 0) throw 'null character';
                for (let character of characters) {
                    character = character.data() ?? {};
                    if (character.hasOwnProperty('rank_text')) {
                        count++;
                        db.doc(`anime_cards/${character.rank_text}`).update({
                            [`${msg.guildId}_protected`]: !character[`${msg.guildId}_protected`],
                        }).catch(err => msg.channel.send(`${msg.author.username} - This product wasn't protected properly. Please contact Sore#1414.`));
                    }
                };
                msg.channel.send(`${msg.author.username} - ${count} cards protected.`);
                return;
            }
            else if (args.length == 1 && args[0].toLowerCase() == 'none') {
                let count = 0;
                let characters = (await db.collection(`anime_cards`).where(`${msg.guildId}_owner_id`, '==', msg.author.id).where(`${msg.guildId}_protected`, '==', true).get())._docs();
                if (characters.length == 0) throw 'null character';
                for (let character of characters) {
                    character = character.data() ?? {};
                    if (character.hasOwnProperty('rank_text')) {
                        count++;
                        db.doc(`anime_cards/${character.rank_text}`).update({
                            [`${msg.guildId}_protected`]: !character[`${msg.guildId}_protected`],
                        }).catch(err => msg.channel.send(`${msg.author.username} - This product wasn't protected properly. Please contact Sore#1414.`));
                    }
                };
                msg.channel.send(`${msg.author.username} - ${count} cards unprotected.`);
                return;
            }
        }
        catch (err) {
            msg.channel.send(`${msg.author.username} - No Protections Changed.`);
            return;
        }

        let character = await require('../utility/queries').owned_character(msg, args);
        if (!character) return;

        const res = await db.doc(`anime_cards/${character.rank_text}`).update({
            [`${msg.guildId}_protected`]: !character[`${msg.guildId}_protected`],
        }).catch(err => msg.channel.send(`${msg.author.username} - This product wasn't protected properly. Please contact Sore#1414.`));

        msg.channel.send(`${msg.author.username} - Protection on ${character[`${msg.guildId}_locked`] == true ? `Locked - ${character.locked_id}` : character.name} set to ${!character[`${msg.guildId}_protected`]}.`);
    }
}