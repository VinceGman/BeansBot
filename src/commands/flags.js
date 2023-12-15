// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'flags',
    alias: ['flag', 'flag:', 'flags:'],
    description: "remove your flags",
    category: 'utility',
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        try {
            let max_penalty_role_name = 'Enemy of the State';
            let max_penalty = false;

            if (args.length == 0) {
                let flag_guide = new EmbedBuilder()
                    .setColor('#fe3939')
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                let flags = (await msg.guild.members.fetch(msg.author.id)).roles.cache.reduce(function (flags, role) {
                    if (role.name.toLowerCase().includes('flag: ')) {
                        if (role.name.toLowerCase().replace('flag: ', '') == max_penalty_role_name.toLowerCase()) {
                            max_penalty = true;
                        }
                        else {
                            flags.push(role.name);
                        }
                    }
                    return flags;
                }, []);

                if (max_penalty) flags.unshift(`Flag: ${max_penalty_role_name}`);

                if (flags.length > 0) {
                    flag_guide.addFields({ name: `Remove Flags`, value: `use remove intructions`, inline: true });
                    if (max_penalty) {
                        flag_guide.addFields({ name: `Cost`, value: `500,000 credits`, inline: true });
                    }
                    else {
                        flag_guide.addFields({ name: `Cost`, value: `100,000 credits`, inline: true });
                    }
                    flag_guide.addFields({ name: '\u200B', value: '\u200B', inline: false })
                    flag_guide.addFields({ name: `Dashboard`, value: `Below are your flags.`, inline: false });
                    for (let flag of flags) {
                        flag_guide.addFields({ name: `> ${flag}`, value: `remove with **+${flag.toLowerCase()}**`, inline: false });
                    }
                }
                else {
                    flag_guide.addFields({ name: 'No Flags', value: 'You have no flags on your account. Well done.', inline: false });
                }

                if (max_penalty) {
                    flag_guide.setTitle(`Flag Guide: ${max_penalty_role_name}`);
                    flag_guide.setDescription(`You have been marked as a terrorist. Your flag removal cost has been increased to 500,000 credits until you pay to remove your **Flag: ${max_penalty_role_name}**`)
                }
                else {
                    flag_guide.setTitle(`Flag Guide`);
                    flag_guide.setDescription(`Flags are penalties that restrict your use of the server and reduce your income.`)
                }

                msg.channel.send({ embeds: [flag_guide] });
                return;
            }

            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            let flag_name = args.join(' ');

            let role_name = '';
            let color = '#fe3939';
            let price = 0;

            let user = await msg.guild.members.fetch(msg.author.id);
            for (let r of user.roles.cache) {
                r = r[1];
                if (r.name.toLowerCase().includes('flag: ')) {
                    if (r.name.toLowerCase().replace('flag: ', '') == flag_name.toLowerCase()) {
                        price = max_penalty ? 500000 : 100000;

                        if (!(await require('../utility/credits').transaction(discord_client, msg, price))) return; // credits manager validates transaction

                        role_name = r.name;
                        color = '#37914f';
                        user.roles.remove(r);
                    }
                }
            };

            let flag_feedback = new EmbedBuilder()
                .setTitle('Flags Removed')
                .setColor(color)
                .addFields({ name: 'Removed', value: role_name == '' ? 'not found' : `${role_name}`, inline: true })
                .addFields({ name: 'Cost', value: `${price}`, inline: true })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [flag_feedback] });
            return;
        }
        catch (err) {
            console.log(err);
            msg.channel.send('Something went wrong during the **+flag** command.');
            return;
        }

    }
}