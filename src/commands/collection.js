module.exports = {
    name: 'collection',
    alias: ['col'],
    options: ['i', 'o'],
    description: "look at a collection",
    admin: false,
    type: "production",
    cooldown: 10,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let origin_guide = new MessageEmbed()
                .setTitle(`Collection Guide`)
                .setColor('#000000')
                .addField('+collection Shingeki no Kyojin', `shows cards from collection 'Shingeki no Kyojin' and all related`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [origin_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown
        let options = require('../utility/parsers').parse_command(msg, this.name, this.alias);

        if (options.includes('o')) {
            var { matches, characters } = await require('../utility/queries').owned_collection(msg, args);
        }
        else {
            var { matches, characters } = await require('../utility/queries').collection(msg, args);
        }

        if (!characters) return;

        characters.sort((a, b) => {
            return a.rank.integerValue - b.rank.integerValue;
        });

        let pages = [];
        if (options.includes('i')) {
            for (let character of characters) {
                pages.push(await require('../utility/embeds').make_card_embed(discord_client, msg, character))
            }
            await require('../utility/pagination').paginationEmbed(msg, pages);
        }
        else {
            let ownedText = '';
            let owned = options.includes('o') ? 'Owned ' : '';
            let page = 1;
            for (let i = 0; i < characters.length; i++) {
                if (ownedText.length >= 600) {
                    pages.push(new MessageEmbed().setTitle(`${owned}Collection - p.${page}`).addField('Owned', ownedText, false));
                    page++;
                    ownedText = '';
                }
                try {
                    var user = await discord_client.users.fetch(characters[i]['owner_id'][characters[i]['owner_id'].valueType]);
                    user = user ? `**${user.username}#${user.discriminator}**` : '[none]';
                }
                catch (err) {
                    user = '[none]'
                }

                let sale = characters[i]['for_sale'][characters[i]['for_sale'].valueType] ? ` - ✅ ${characters[i]['selling_price'][characters[i]['selling_price'].valueType]}` : '';

                ownedText += `${characters[i]['name'][characters[i]['name'].valueType]}${sale} - #${characters[i]['rank'][characters[i]['rank'].valueType]} => ${user}\n`;

                if (i == characters.length - 1) {
                    let owned = options.includes('o') ? 'Owned ' : '';
                    page = page == 1 ? '' : ` - p.${page}`;
                    pages.push(new MessageEmbed().setTitle(`${owned}Collection${page}`).addField('Owned', ownedText, false));
                }
            }

            if (characters.length == 0) {
                pages.push(new MessageEmbed().setTitle(`${owned}Collection`).addField('Owned', '[none]', false));
            }

            pages.forEach(page => {
                page.setDescription(matches.join('\n'))
                    .setColor(`#fc5d65`)
                    .setFooter({ text: `BHP Collection` })
                    .setTimestamp();
            });

            await require('../utility/pagination').paginationEmbed(msg, pages);
        }
    }
}