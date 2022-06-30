const { MessageEmbed } = require('discord.js');
let { secret } = require('./confessions.js');

module.exports = {
    name: 'idlookup',
    description: "idlookup for the users in confessions",
    admin: true,
    type: "final",
    async execute(discord_client, msg, args, admin) {
        if (args.length == 0 || args.length == 2 || args.length >= 4) {
            msg.channel.send("+idlookup <id> | +idlookup <id> <month> <day>");
            return;
        }

        let bot_log = msg.client.guilds.cache.get(process.env.server_id).channels.cache.get(process.env.discord_bot_log_id);

        let id = args[0];
        let month = args[1];
        let day = args[2];

        let date = new Date();

        month = month ? month : date.getMonth() + 1;
        day = day ? day : date.getDate();

        let day_secret = await secret(day);
        let month_secret = await secret(month);

        (await discord_client.guilds.cache.get(process.env.server_id).members.fetch()).forEach(member => {
            if (+((member.id * day_secret * month_secret) % 1000000).toString().slice(0, 6) == id) {
                bot_log.send({
                    embeds: [new MessageEmbed()
                        .setTitle(`ID Lookup`)
                        .setDescription(`You've requested the idenity of a user.`)
                        .addFields(
                            { name: 'User', value: `ID: ${id}`, inline: true },
                            { name: 'Requested By', value: `${msg.author.username}#${msg.author.discriminator}`, inline: true },
                            { name: 'Identity', value: `${member.user.username}#${member.user.discriminator}`, inline: true },
                            { name: 'Notice', value: `This user was notified that their identity was revealed.`, inline: false },
                        )
                        .setColor(`#000000`)
                        .setFooter({ text: `Beans Staff Message` })
                        .setTimestamp()
                    ]
                });

                member.send({
                    embeds: [new MessageEmbed()
                        .setTitle(`ID Breach Notice`)
                        .setDescription(`Your identity was revealed.\n\n\n`)
                        .addFields(
                            { name: 'Notice', value: `Your message(s) likely included something that generated concern. \n\nOnly **ID: ${id}** was breached. \n\nID's change every day. Contact staff for more information.`, inline: false },
                            { name: 'Requested By', value: `${msg.author.username}#${msg.author.discriminator}`, inline: true },
                            { name: 'Identity', value: `ID: ${id}`, inline: true },
                            { name: 'Active Day', value: `${month}/${day}`, inline: true },
                        )
                        .setColor(`#000000`)
                        .setFooter({ text: `Beans Staff Message` })
                        .setTimestamp()
                    ]
                });

                if (msg.channel != bot_log) {
                    msg.channel.send("User specific information has been sent to bot_log.")
                }
            }
        });
    }
}
