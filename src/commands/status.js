const fs = require('fs');
const { MessageEmbed } = require('discord.js');
const { active_service } = require('./confessions.js');

module.exports = {
    name: 'status',
    description: "status of beans",
    admin: true,
    type: "final",
    async execute(discord_client, msg, args, admin) {
        if (args.length <= 0) {
            let status_embed = new MessageEmbed()
                .setTitle(`Status`)
                .setDescription(`Comprehensive System Report`)
                .setColor(`#000000`)
                .setFooter({ text: `Beans Staff Message` })
                .setTimestamp();

            const serviceFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
            for (const file of serviceFiles) {
                const service = require(`./${file}`);

                if (service.hasOwnProperty('active_service')) {
                    status_embed.addField(`${service.name.charAt(0).toUpperCase()}${service.name.slice(1)}`, `Active: ${service.active_service}`, false);
                }
            }

            msg.channel.send({ embeds: [status_embed] });
        }
        else if (args.length == 1) {
            let service = false;
            const serviceFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
            for (const file of serviceFiles) {
                if (file == args[0] + '.js') {
                    service = require(`./${file}`);
                    service.service_toggle();
                }
            }

            if (service) {
                msg.channel.send(`Service: ${service.name.charAt(0).toUpperCase()}${service.name.slice(1)} | Active: ${service.active_service}`);
            }
            else {
                msg.channel.send('This service does not exist.');
            }
        }
    }
}