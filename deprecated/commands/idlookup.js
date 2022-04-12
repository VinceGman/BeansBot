module.exports = {
    name: 'idlookup',
    description: "idlookup for the users in confessions",
    admin: true,
    type: "final",
    execute(message, args, admin) {
        const index = require('../index.js').execute();

        if (args.length == 0) {
            message.channel.send("+idlookup <id> | +idlookup <id> <month> <day>");
            return;
        }

        let id = args[0];
        let month = args[1];
        let day = args[2];

        let date = new Date();

        month = month ? month : date.getMonth() + 1;
        day = day ? day : date.getDate();

        index.discord_server.members.cache.forEach(member => {
            if (+((member.id * 23 * day * month) % 1000000).toString().slice(0, 6) == id) {

                index.discord_log.send(new index.Discord.MessageEmbed()
                    .setTitle(`ID Lookup`)
                    .setDescription(`You've requested the idenity of a user.`)
                    .addFields(
                        { name: 'User', value: `user_id: ${id}`, inline: true },
                        { name: 'Identity', value: `${member.user.username}`, inline: true },
                        { name: 'Notice', value: `This user was notified that their identity was revealed.`, inline: false },
                    )
                    .setColor(`#000000`)
                    .setFooter(`${date.toDateString()}`)
                    .setTimestamp());

                member.send(new index.Discord.MessageEmbed()
                    .setTitle(`ID Breach Notice`)
                    .setDescription(`Your identity was revealed.\n\n\n`)
                    .addFields(
                        { name: 'Notice', value: `Your message(s) likely included something that generated concern. \n\nOnly **ID: ${id}** was breached. \n\nID's change every day. Contact staff for more information.`, inline: false },
                        { name: 'Requested By', value: `${message.author.username}`, inline: true },
                        { name: 'Identity', value: `user_id: ${id}`, inline: true },
                        { name: 'Active Day', value: `${month}/${day}`, inline: true },
                    )
                    .setColor(`#000000`)
                    .setFooter(`${date.toDateString()}`)
                    .setTimestamp());

                if (message.channel != index.discord_log) {
                    message.channel.send("User specific information has been sent to log.")
                }
            }
        });
    }
}
