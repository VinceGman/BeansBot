const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const wrapText = require("wrap-text");
let textWrap = 31;

module.exports = {
    async print_lootbox(msg, character) {

        let character_embed = new EmbedBuilder();

        if (character[`${msg.guildId}_locked`]) {
            character_embed.setTitle(`Locked`)
                .setDescription(`ID: ${character.locked_id}`)
                .setImage(`https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Black_colour.jpg/1536px-Black_colour.jpg`)
                .setColor('#000000')
                .addFields({ name: 'Rarity', value: `${character.rarity} - ${character.stars}`, inline: true })
                .addFields({ name: 'Owner', value: wrapText(`${msg.author.username}`, textWrap), inline: false })
        }
        else {
            character_embed.setTitle(`${wrapText(character.name, textWrap)}`)
                .setDescription(`${wrapText(character.origin, textWrap)}`)
                .setImage(`${character.image}`)
                .setColor(character.color)
                .addFields({ name: 'Rank', value: `#${character.rank_text}`, inline: true })
                .addFields({ name: 'Rarity', value: `${character.rarity} - ${character.stars}`, inline: true })
                .addFields({ name: 'Owner', value: wrapText(`${msg.author.username}`, textWrap), inline: false })
        }

        character_embed.setFooter({ text: 'Beans - ACC' }).setTimestamp();

        msg.channel.send({ embeds: [character_embed] });
    },
    async make_card_embed(discord_client, msg, character) {
        try {
            var owner = await discord_client.users.fetch(character[`${msg.guildId}_owner_id`]);
            owner = owner ? `${owner.username}` : '[none]';
        }
        catch (err) {
            owner = '[none]';
        }

        let character_embed = new EmbedBuilder();

        if (character[`${msg.guildId}_locked`]) {
            character_embed.setTitle(`Locked`)
                .setDescription(`ID: ${character.locked_id} `)
                .setImage(`https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Black_colour.jpg/1536px-Black_colour.jpg`)
                .setColor('#000000')
                .addFields({ name: 'Rarity', value: `${character.rarity} - ${character.stars}`, inline: true })
                .addFields({ name: 'Owner', value: wrapText(`${msg.author.username}`, textWrap), inline: false })
        }
        else {
            character_embed.setTitle(`${wrapText(character.name, textWrap)}`)
                .setDescription(`${wrapText(character.origin, textWrap)}`)
                .setImage(`${character.image}`)
                .setColor(character.color)
                .addFields({ name: 'Rank', value: `#${character.rank_text}`, inline: true })
                .addFields({ name: 'Rarity', value: `${character.rarity} - ${character.stars}`, inline: true })
                .addFields({ name: 'Owner', value: wrapText(owner, textWrap), inline: false })
        }

        character_embed.setFooter({ text: 'Beans - ACC' }).setTimestamp();

        return character_embed;
    },
    async notice_embed(discord_client, msg, content, color) {
        let notice_embed = new EmbedBuilder()
            .setDescription(`${content}`)
            .setColor(color)
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();
        msg.channel.send({ embeds: [notice_embed] });
        return;
    }
}