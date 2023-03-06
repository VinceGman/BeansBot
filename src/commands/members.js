module.exports = {
    name: 'members',
    description: "members command",
    category: 'information',
    scopes: ['global'],
    admin: true,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        let members_guide = new MessageEmbed()
            .setColor('#000000')
            .setFooter({ text: `Beans Staff Message` })
            .setTimestamp();

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let members = await msg.guild.members.fetch();

        let date = Date.now();
        let seconds_in_a_day = 86400;

        let count = 0;
        for (let member of members) {
            member = member[1];
            if (member.user.bot) continue;

            count++;

            let weeks_of_membership = ((date - member.joinedTimestamp) / (seconds_in_a_day * 7 * 1000)).toFixed(0);
            let level = 0;
            for (let role of member._roles) {
                role = await msg.guild.roles.fetch(role);
                if (!role.name.toLowerCase().includes('level')) continue;
                level = role.name.toLowerCase().replace('level', '').trim();
            }

            if (+weeks_of_membership <= +level) continue;
            if (+weeks_of_membership <= 3) continue;
            if (+level > 8) continue;

            members_guide.addField(`${member.user.username}`, `Level: ${level} - Weeks: ${weeks_of_membership}`, false)

        }
        members_guide
            .setTitle(`Members: ${count}`)
            .setDescription(`Excludes Weeks <= 3 and Levels > 8`)

        msg.channel.send({ embeds: [members_guide] });
        return;
    }
}