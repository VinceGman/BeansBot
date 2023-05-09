module.exports = {
    name: 'nasa',
    alias: ['apod'],
    description: "NASA's Astronomy Picture of the Day",
    category: 'information',
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        try {
            // const { MessageEmbed } = require('discord.js');

            // if (args.length == 0) {
            //     let nasa_guide = new MessageEmbed()
            //         .setTitle(`nasa Guide`)
            //         .setDescription(`nasa description text.`)
            //         .setColor('#000000')
            //         .addField('+nasa ex', `nasa text`, false)
            //         .addField('+nasa second ex', `nasa text`, false)
            //         .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
            //         .setTimestamp();

            //     msg.channel.send({ embeds: [nasa_guide] });
            //     return;
            // }

            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            let res;
            var apod = require('nasa-apod');

            if (args.length == 1 && args[0].toLowerCase() == 'today') {
                res = await apod();
            }
            else {
                res = await apod();
                // res = await apod(new Date(Math.floor(Math.random() * odds) + 1970, Math.floor(Math.random() * odds) + 1, Math.floor(Math.random() * odds) + 1));
            }

            const { MessageEmbed } = require('discord.js');

            let nasa_embed = new MessageEmbed()
                .setTitle(`${res.title}`)
                .setDescription(`${res.explanation}`)
                .addField(`Date`, `${res.date}`, false)
                .setImage(`${res.url}`)
                .setColor('#0c3227')
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [nasa_embed] });
            return;

        }
        catch (err) {
            msg.channel.send(`Something went wrong with the Nasa's API.`);
        }
    }
}