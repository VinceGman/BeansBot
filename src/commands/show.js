module.exports = {
    name: 'show',
    alias: ['see', 'look'],
    description: "look at a card",
    category: 'cards',
    admin: false,
    type: "test",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        const { EmbedBuilder } = require('discord.js');

        if (args.length == 0) {
            let show_guide = new EmbedBuilder()
                .setTitle(`Show Guide`)
                .setColor('#000000')
                .setDescription(`Locked cards won't show.`)
                .addFields({ name: '+show 123', value: `shows card with rank #123`, inline: false })
                .addFields({ name: '+show Nezuko Kamado', value: `shows cards with name 'Nezuko Kamado'`, inline: false })
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [show_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown
        let characters = await require('../utility/queries').character(msg, args);
        if (!characters) return;

        let pages = [];
        for (let character of characters) {
            pages.push(await require('../utility/embeds').make_card_embed(discord_client, msg, character))
        }
        await require('../utility/pagination').paginationEmbed(msg, pages);
    }
}