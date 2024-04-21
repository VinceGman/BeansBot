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
            let rating = '';
            rating = character.rating.startsWith('R+') ? ' - 🌶️' : rating;
            rating = character.rating.startsWith('Rx') ? ' - 🔞' : rating;
            character_embed.setTitle(`${wrapText(character.name, textWrap)}`)
                .setDescription(`${wrapText(`${character.origin}${rating}`, textWrap)}`)
                .setImage(`${character.image}`)
                .setColor(character.color)
                .addFields({ name: 'Rank', value: `#${character.rank_text}`, inline: true })
                .addFields({ name: 'Rarity', value: `${character.rarity} - ${character.stars}`, inline: true })
                .addFields({ name: 'Owner', value: wrapText(`${msg.author.username}`, textWrap), inline: false })
        }

        character_embed.setFooter({ text: 'Beans - ACC' }).setTimestamp();

        let char_embed = msg.channel.send({ embeds: [character_embed] });

        return await char_embed;
    },
    async make_card_embed(discord_client, msg, character, profile = false) {
        let character_embed = new EmbedBuilder();

        if (!character[`${msg.guildId}_locked`] || !profile) {
            let rating = '';
            rating = character.rating.startsWith('R+') ? ' - 🌶️' : rating;
            rating = character.rating.startsWith('Rx') ? ' - 🔞' : rating;
            character_embed.setTitle(`${wrapText(character.name, textWrap)}`)
                .setDescription(`${wrapText(`${character.origin}${rating}`, textWrap)}`)
                .setImage(`${character.image}`)
                .setColor(character.color)
                .addFields({ name: 'Rank', value: `#${character.rank_text}`, inline: true })
                .addFields({ name: 'Rarity', value: `${character.rarity} - ${character.stars}`, inline: true })
        }
        else {
            character_embed.setTitle(`Locked`)
                .setDescription(`ID: ${character.locked_id} `)
                .setImage(`https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Black_colour.jpg/1536px-Black_colour.jpg`)
                .setColor('#000000')
                .addFields({ name: 'Rarity', value: `${character.rarity} - ${character.stars}`, inline: true })
        }


        let owner = '[none]';
        try {
            owner = !character[`${msg.guildId}_locked`] || profile ? (await discord_client?.users?.fetch(character[`${msg.guildId}_owner_id`])).username ?? '[none]' : '[none]';
        }
        catch (err) {
            owner = '[none]';
        }

        character_embed.addFields({ name: 'Owner', value: wrapText(owner, textWrap), inline: false })
            .setFooter({ text: 'Beans - ACC' })
            .setTimestamp();

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
    },
    async personalized_embed(msg, id = msg.author.id, db_user, guild_member) {
        db_user = db_user ? db_user : await require('../utility/queries').user(id);
        guild_member = guild_member ? guild_member : await msg.guild.members.fetch(id);

        let personalized_embed = new EmbedBuilder()
            .setTitle(`${wrapText(`${db_user.pref_name ?? guild_member.nickname ?? guild_member.displayName}`, textWrap)}`)
            .setThumbnail(db_user.pref_image ?? guild_member.displayAvatarURL())
            .setColor(db_user.pref_color ?? guild_member.displayHexColor)
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        if (db_user.pref_status) {
            personalized_embed.setDescription(wrapText(db_user.pref_status, textWrap));
        }

        return { db_user, guild_member, personalized_embed };
    }
}