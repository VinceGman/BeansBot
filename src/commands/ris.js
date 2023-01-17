const fs = require('fs');

module.exports = {
    name: 'ris',
    alias: ['image'],
    description: "reverse image search",
    admin: false,
    type: "production",
    cooldown: 10,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let image_search_guide = new MessageEmbed()
                .setTitle(`Reverse Image Search Guide`)
                .setDescription(`Find the source of any image, even someone's profile picture.`)
                .setColor('#000000')
                .addField('+ris <image_link>', `Returns the sources of the image linked.`, false)
                .addField('+ris @person', `Returns the sources of @person's profile picture.`, false)
                .addField('+ris id', `Returns the sources of @person's profile picture using their ID.`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [image_search_guide] });
            return;
        }

        // TODO; using ID will delete the message
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        var image_url = '';
        if (args.length == 1) {
            if (msg.mentions.users.size > 0) {
                let guild_user = await this.getGuildUser(msg, msg.mentions.users.keys().next().value);
                if (!guild_user) {
                    msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - User could not be found.`);
                    return;
                }
                image_url = guild_user.displayAvatarURL({ size: 1024, dynamic: true });
            }
            else if (!isNaN(args[0])) {
                let guild_user = await this.getGuildUser(msg, args[0]);
                if (!guild_user) {
                    msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - User could not be found.`);
                    return;
                }
                image_url = guild_user.displayAvatarURL({ size: 1024, dynamic: true });
            }
            else {
                const isImageURL = require('image-url-validator').default;
                if (!(await isImageURL(args[0]))) {
                    msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - The image must be an image link.`);
                    return;
                }
                image_url = args[0];
            }
        }

        const download = require('image-downloader');
        const google = require('googlethis');

        const options = {
            url: image_url,
            dest: `../../images/${msg.author.id}_image_${Math.floor(Math.random() * 100) + 1}`,
            extractFilename: false,
        };

        const downloaded_image = await download.image(options);

        const local_image = fs.readFileSync(downloaded_image.filename);
        const reverse = await google.search(local_image, { ris: true });

        fs.unlinkSync(downloaded_image.filename);

        let pages = [];
        let i = 1;
        for (let result of reverse.results) {
            let image_search_embed = new MessageEmbed()
                .setAuthor({ name: `Reverse Image Search - Source ${i}`, iconURL: result.favicons.high_res, url: result.url })
                .setImage(image_url)
                .setColor('#000000')
                .addField('Title', result.title, false)
                .addField('Description', result.description, false)
                .addField('Url', result.url)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();
            pages.push(image_search_embed)
            i++;
        }

        if (reverse.results.length == 0) {
            let image_search_embed = new MessageEmbed()
                .setAuthor({ name: `Reverse Image Search - No Sources` })
                .setDescription('Image could not be traced.')
                .setImage(image_url)
                .setColor('#000000')
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();
            pages.push(image_search_embed)
        }

        await require('../utility/pagination').paginationEmbed(msg, pages);
        return;
    },
    async getGuildUser(msg, id) {
        try {
            let guild_user = await msg.guild.members.fetch(id);
            return guild_user;
        }
        catch (err) {
            return undefined;
        }
    }
}