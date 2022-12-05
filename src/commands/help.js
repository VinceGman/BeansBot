const fs = require('fs');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'help',
    description: "gives relevant bot information",
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        // different based on how many args
        // check name, desc, admin, type and active_service

        let help_embed = new MessageEmbed()
            .setTitle(`+help`)
            .setDescription(`**Beans**: Command Descriptions\n\nMost commands will work or give you more information if you just type it in.`)
            .setColor(`#000000`)
            .setFooter({ text: `Beans Staff Message` })
            .setTimestamp();

        const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`./${file}`);

            let aliases = '';
            if (command.hasOwnProperty('alias')) {
                command.alias.forEach(alias => {
                    aliases += ` | +${alias}`
                });
            }

            if (command.hasOwnProperty('active_service') || command.type == 'test' || command.name == 'topic' || command.name == 'example') {
                // ignore
            }
            else if (command.admin == false) {
                help_embed.addField(`+${command.name}${aliases}`, `${command.description}`, true);
            }
            else if (command.admin == true && admin) {
                help_embed.addField(`+${command.name}${aliases} - Admin Only`, `${command.description}`, true);
            }
        }

        // help_embed.addField('\u200B', '\u200B', false);

        // for (const file of commandFiles) {
        //     const command = require(`./${file}`);

        //     if (command.hasOwnProperty('active_service')) { // dont show services to non admins TODO
        //         let active = command.active_service ? 'This service is active.' : 'This service is down.';
        //         help_embed.addField(`${command.name.charAt(0).toUpperCase()}${command.name.slice(1)}`, `${active}`, false);
        //     }
        // }


        msg.channel.send({ embeds: [help_embed] });
    }
}