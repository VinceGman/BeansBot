module.exports = {
    name: 'roles',
    alias: ['role', 'opt'],
    description: "role assignment",
    category: 'utility',
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let opt_roles = msg.guild.roles.cache.filter(r => r.name.includes('opt: ')).map(r => r.name.replace('opt: ', '')).sort((a, b) => b - a);

            let role_guide = new MessageEmbed()
                .setTitle(`Role Guide`)
                .setColor('#000000')
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            for (let role of opt_roles) {
                role_guide.addField(`+role ${role}`, `assigns **opt: ${role}**`, false);
            }

            msg.channel.send({ embeds: [role_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let input = args.join(' ').toLowerCase();

        let role = msg.guild.roles.cache.find(r => r.name.toLowerCase().includes('opt: ') && r.name.toLowerCase().includes(input));

        if (!role) {
            let role_embed = new MessageEmbed()
                .setTitle(`Role Not Found`)
                .setColor(`#000000`)
                .setDescription(`See -> **+roles**`)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [role_embed] });
            return;
        }

        let user = await msg.guild.members.fetch(msg.author.id);

        let role_already_attached = false;
        user.roles.cache.forEach(r => {
            if (r.name == role.name) {
                role_already_attached = true;
                user.roles.remove(r);
            }
        });

        let role_status = 'Removed';
        if (!role_already_attached) {
            user.roles.add(role);
            role_status = 'Assigned';
        }

        let role_embed = new MessageEmbed()
            .setTitle(`Role ${role_status}`)
            .setColor(`#${role.color.toString(16).padStart(6, '0').toUpperCase()}`)
            .setDescription(`${role.name}`)
            .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
            .setTimestamp();

        msg.channel.send({ embeds: [role_embed] });
        return;
    }
}