const { MessageEmbed } = require('discord.js');
const wrapText = require("wrap-text");
let textWrap = 31;

module.exports = {
    print_lootbox(msg, character) {
        let character_embed = new MessageEmbed()
            .setTitle(`${wrapText(character['name'][character['name'].valueType], textWrap)}`)
            .setDescription(`${wrapText(character['origin'][character['origin'].valueType], textWrap)}`)
            .setImage(`${character['image'][character['image'].valueType]}`)
            .setColor(character['color'][character['color'].valueType])
            .addField('Rank', `#${character['rank_text'][character['rank_text'].valueType]}`, true)
            .addField('Rarity', `${character['rarity'][character['rarity'].valueType]} - ${character['stars'][character['stars'].valueType]}`, true)
            .addField('Owner', wrapText(`${msg.author.username}#${msg.author.discriminator}`, textWrap), false)
            .setFooter({ text: 'BHP - Edition One' })
            .setTimestamp();

        msg.channel.send({ embeds: [character_embed] });
    },
    async make_card_embed(discord_client, msg, character) {
        let owner = await discord_client.users.fetch(character['owner_id'][character['owner_id'].valueType]);
        owner = owner == null ? '[none]' : `${owner.username}#${owner.discriminator}`;

        let character_embed = new MessageEmbed()
            .setTitle(`${wrapText(character['name'][character['name'].valueType], textWrap)}`)
            .setDescription(`${wrapText(character['origin'][character['origin'].valueType], textWrap)}`)
            .setImage(`${character['image'][character['image'].valueType]}`)
            .setColor(character['color'][character['color'].valueType])
            .addField('Rank', `#${character['rank_text'][character['rank_text'].valueType]}`, true)
            .addField('Rarity', `${character['rarity'][character['rarity'].valueType]} - ${character['stars'][character['stars'].valueType]}`, true)
            .addField('Owner', wrapText(owner, textWrap), false)
            .setFooter({ text: 'BHP - Edition One' })
            .setTimestamp();

        return character_embed;
    }
}