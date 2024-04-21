module.exports = {
    name: 'collection',
    alias: ['col'],
    options: ['i', 'o'],
    description: "look at a collection",
    category: 'cards',
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        const { EmbedBuilder } = require('discord.js');

        if (args.length == 0) {
            let origin_guide = new EmbedBuilder()
                .setTitle(`Collection Guide`)
                .setColor('#000000')
                .addFields({ name: '+collection Shingeki no Kyojin', value: `shows cards from collection 'Shingeki no Kyojin' and all related`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [origin_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown
        let options = require('../utility/parsers').parse_command(msg, this.name, this.alias);

        // try {
        //     const { Anime } = require("@shineiichijo/marika"); // const { Anime, Character, Manga } = require("@shineiichijo/marika")
        //     const animeClient = new Anime();

        //     let result = (await animeClient.searchAnime(args.join(' ')))?.data?.[0];
        //     let anime = (await animeClient.getAnimeFullById(result?.mal_id));

        //     let relations_title = anime?.relations?.[0]?.entry?.[0]?.name;

        //     console.log(relations_title);

        //     if (relations_title) args = relations_title.split(' ');
        // }
        // catch (err) {
        //     // silently fail
        // }

        if (options.includes('o')) {
            var { matches, characters } = await require('../utility/queries').owned_collection(msg, args);
        }
        else {
            var { matches, characters } = await require('../utility/queries').collection(msg, args);
        }

        if (!characters) return;

        if (characters.length == 0) {
            msg.channel.send(`${msg.author.username} - No characters from this collection are owned.`);
            return;
        }

        // characters.sort((a, b) => {
        //     return a.rank.integerValue - b.rank.integerValue;
        // });

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
                    pages.push(new EmbedBuilder().setTitle(`${owned}Collection - p.${page}`).addFields({ name: 'Owned', value: `${ownedText}`, inline: false }));
                    page++;
                    ownedText = '';
                }
                try {
                    var user = await discord_client.users.fetch(characters[i][`${msg.guildId}_owner_id`]);
                    user = user && !characters[i][`${msg.guildId}_locked`] ? `**${user.username}**` : '[none]';
                }
                catch (err) {
                    user = '[none]';
                }

                // let sale = characters[i]['for_sale'][characters[i]['for_sale'].valueType] ? ` - ✅ ${characters[i]['selling_price'][characters[i]['selling_price'].valueType]}` : '';

                ownedText += `${characters[i].name} - #${characters[i].rank} => ${user}\n`;

                if (i == characters.length - 1) {
                    let owned = options.includes('o') ? 'Owned ' : '';
                    page = page == 1 ? '' : ` - p.${page}`;
                    pages.push(new EmbedBuilder().setTitle(`${owned}Collection${page}`).addFields({ name: 'Owned', value: `${ownedText}`, inline: false }));
                }
            }

            if (characters.length == 0) {
                pages.push(new EmbedBuilder().setTitle(`${owned}Collection`).addFields({ name: 'Owned', value: `[none]`, inline: false }));
            }

            pages.forEach(page => {
                page.setDescription(matches.join('\n'))
                    .setColor(`#fc5d65`)
                    .setFooter({ text: `Beans Collection` })
                    .setTimestamp();
            });

            await require('../utility/pagination').paginationEmbed(msg, pages);
        }
    }
}