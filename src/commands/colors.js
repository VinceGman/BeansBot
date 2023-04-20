module.exports = {
    name: 'colors',
    alias: ['color'],
    description: "color assignment",
    category: 'utility',
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let color_guide = new MessageEmbed()
                .setTitle(`Color Guide`)
                .setDescription(`Colors -> http://www.coffeebeansclub.com/`)
                .setColor('#000000')
                .addField('+color snow', `assigns **color: snow**`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [color_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let color = args.join(' ').toLowerCase();

        let role = msg.guild.roles.cache.find(r => r.name.toLowerCase().includes('color: ') && r.name.toLowerCase().includes(color));

        if (!role) {
            let color_embed = new MessageEmbed()
                .setTitle(`Color Not Found`)
                .setColor(`#000000`)
                .setDescription(`See -> **+colors**`)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [color_embed] });
            return;
        }

        let user = await msg.guild.members.fetch(msg.author.id);

        user.roles.cache.forEach(r => {
            if (r.name.toLowerCase().includes('color: ')) {
                user.roles.remove(r);
            }
        });

        user.roles.add(role);

        let color_embed = new MessageEmbed()
            .setTitle(`Color Assigned`)
            .setColor(`#${role.color.toString(16).padStart(6, '0').toUpperCase()}`)
            .setDescription(`${role.name}`)
            .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
            .setTimestamp();

        msg.channel.send({ embeds: [color_embed] });
        return;
    }
}