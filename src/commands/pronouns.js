module.exports = {
    name: 'pronouns',
    alias: ['pronoun', 'pn', 'pns'],
    description: "pronouns assignment",
    category: 'utility',
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let pronoun_guide = new MessageEmbed()
                .setTitle(`Pronoun Guide`)
                .setColor('#000000')
                .setDescription('Any part of the pronoun you intend will add the right one.')
                .addField(`+pronouns he`, `assigns **he/him**`, false)
                .addField(`+pronoun her`, `assigns **she/her**`, false)
                .addField(`+pn they/them`, `assigns **they/them**`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [pronoun_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let pronouns = 'he/him';
        if (args.length == 1) {
            let input = args[0].toLowerCase();
            if ('he/him'.includes(input)) {
                pronouns = 'he/him';
            }
            else if ('she/her'.includes(input)) {
                pronouns = 'she/her';
            }
            else if ('they/them'.includes(input)) {
                pronouns = 'they/them';
            }
            else {
                let pronouns_embed = new MessageEmbed()
                    .setTitle(`Pronoun Not Found`)
                    .setColor(`#000000`)
                    .setDescription(`See -> **+pronouns**`)
                    .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                    .setTimestamp();

                msg.channel.send({ embeds: [pronouns_embed] });
                return;
            }
        }

        let role = msg.guild.roles.cache.find(r => r.name.toLowerCase() == pronouns);

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
            .setTitle(`Pronouns ${role_status}`)
            .setColor(`#${role.color.toString(16).padStart(6, '0').toUpperCase()}`)
            .setDescription(`${role.name}`)
            .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
            .setTimestamp();

        msg.channel.send({ embeds: [role_embed] });
        return;
    }
}