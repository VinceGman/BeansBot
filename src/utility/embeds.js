const { EmbedBuilder } = require('discord.js');
const wrapText = require("wrap-text");
let textWrap = 31;

module.exports = {
    print_lootbox(msg, character) {
        let character_embed = new EmbedBuilder()
            .setTitle(`${wrapText(character['name'][character['name'].valueType], textWrap)}`)
            .setDescription(`${wrapText(character['origin'][character['origin'].valueType], textWrap)}`)
            .setImage(`${character['image'][character['image'].valueType]}`)
            .setColor(character['color'][character['color'].valueType])
            .addField('Rank', `#${character['rank_text'][character['rank_text'].valueType]}`, true)
            .addField('Rarity', `${character['rarity'][character['rarity'].valueType]} - ${character['stars'][character['stars'].valueType]}`, true)
            .addField('Stats', `A${character['attack'][character['attack'].valueType]} H${character['health'][character['health'].valueType]} T${character['type'][character['type'].valueType]}`)
            .addField('Owner', wrapText(`${msg.author.username}`, textWrap), false)
            .setFooter({ text: 'Beans - Edition One' })
            .setTimestamp();

        msg.channel.send({ embeds: [character_embed] });
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
            .addField('Rank', `#${character['rank_text'][character['rank_text'].valueType]}`, true)
            .addField('Rarity', `${character['rarity'][character['rarity'].valueType]} - ${character['stars'][character['stars'].valueType]}`, true)
            .addField('Stats', `A${character['attack'][character['attack'].valueType]} H${character['health'][character['health'].valueType]} T${character['type'][character['type'].valueType]}`)
            .addField('Owner', wrapText(owner, textWrap), false)
            .setFooter({ text: 'Beans - Edition One' })
            .setTimestamp();

        if (character.for_sale.booleanValue) {
            character_embed.addField('Price', `${character['selling_price'][character['selling_price'].valueType]}`, true)
        }

        return character_embed;
    }
}