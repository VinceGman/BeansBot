const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const wrapText = require("wrap-text");
let textWrap = 31;

module.exports = {
    async print_lootbox(msg, character) {

        let character_embed = new EmbedBuilder();

        if (character.locked) {
            character_embed.setTitle(`Locked`)
                .setDescription(`ID: ${character.mal_id}`)
                .setImage(`https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Black_colour.jpg/1536px-Black_colour.jpg`)
                .setColor('#000000')
                .addFields({ name: 'Rarity', value: `${this.get_card_rarity(character.rank)} - ${this.get_card_stars(character.rank)}`, inline: true })
                .addFields({ name: 'Owner', value: wrapText(`${msg.author.username}`, textWrap), inline: false })
                .setFooter({ text: 'Beans - ACC' })
                .setTimestamp();
        }
        else {
            character_embed.setTitle(`${wrapText(character.name, textWrap)}`)
                .setDescription(`${wrapText(character.origin, textWrap)}`)
                .setImage(`${character.image}`)
                .setColor(this.get_card_color(character.rank))
                .addFields({ name: 'Rank', value: `#${character.rank_text}`, inline: true })
                .addFields({ name: 'Rarity', value: `${this.get_card_rarity(character.rank)} - ${this.get_card_stars(character.rank)}`, inline: true })
                .addFields({ name: 'Owner', value: wrapText(`${msg.author.username}`, textWrap), inline: false })
        }

        character_embed.setFooter({ text: 'Beans - ACC' }).setTimestamp();

        msg.channel.send({ embeds: [character_embed] });
    },
    get_card_color(rank) {
        if (rank <= 20) return '#fc5d65';
        if (rank <= 200) return '#ffab4b';
        if (rank <= 800) return '#c369ec';
        if (rank <= 2000) return '#0070DD';
        if (rank <= 8000) return '#7aaf74';
        return '#FFFFFF';
    },
    get_card_rarity(rank) {
        if (rank <= 20) return 'Ultimate';
        if (rank <= 200) return 'Legendary';
        if (rank <= 800) return 'Epic';
        if (rank <= 2000) return 'Rare';
        if (rank <= 8000) return 'Uncommon';
        return 'Common';
    },
    get_card_stars(rank) {
        if (rank <= 20) return '★★★★★★';
        if (rank <= 200) return '★★★★★';
        if (rank <= 800) return '★★★★';
        if (rank <= 2000) return '★★★';
        if (rank <= 8000) return '★★';
        return '★';
    },
    async make_card_embed(discord_client, msg, character) {
        try {
            var owner = await discord_client.users.fetch(character['owner_id'][character['owner_id'].valueType]);
            owner = owner ? `${owner.username}#${owner.discriminator}` : '[none]';
        }
        catch (err) {
            owner = '[none]'
        }

        let character_embed = new EmbedBuilder()
            .setTitle(`${wrapText(character['name'][character['name'].valueType], textWrap)}`)
            .setDescription(`${wrapText(character['origin'][character['origin'].valueType], textWrap)}`)
            .setImage(`${character['image'][character['image'].valueType]}`)
            .setColor(character['color'][character['color'].valueType])
            .addFields({ name: 'Rank', value: `#${character['rank_text'][character['rank_text'].valueType]}`, inline: true })
            .addFields({ name: 'Rarity', value: `${character['rarity'][character['rarity'].valueType]} - ${character['stars'][character['stars'].valueType]}`, inline: true })
            .addFields({ name: 'Stats', value: `A${character['attack'][character['attack'].valueType]} H${character['health'][character['health'].valueType]} T${character['type'][character['type'].valueType]}`, inline: false })
            .addFields({ name: 'Owner', value: wrapText(owner, textWrap), inline: false })
            .setFooter({ text: 'Beans - Edition One' })
            .setTimestamp();

        if (character.for_sale.booleanValue) {
            character_embed.addFields({ name: 'Price', value: `${character['selling_price'][character['selling_price'].valueType]}`, inline: true })
        }

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