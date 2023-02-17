module.exports = {
    name: 'help',
    description: "gives relevant bot information",
    category: 'utility',
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        const fs = require('fs');

        const commands_sorted = {};
        const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`./${file}`);

            if (command.type == 'test') {
                // ignore
            }
            else if (command.admin == false || (command.admin == true && admin)) {
                if (!commands_sorted[command.category]) commands_sorted[command.category] = [];
                commands_sorted[command.category].push(command);
            }
        }

        let pages = [];
        let page_num = 1;
        for (let category in commands_sorted) {
            const { MessageEmbed } = require('discord.js');

            let help_embed = new MessageEmbed()
                .setTitle(`+help`)
                .setDescription(`**Beans**: Command Descriptions\n\nCommands work in #commands unless stated.`)
                .setColor(`#000000`)
                .setFooter({ text: `${category} - p.${page_num}` })
                .setTimestamp();
            for (let command of commands_sorted[category]) {

                let aliases = '';
                if (command.hasOwnProperty('alias')) {
                    aliases = ' => Alias: ' + command.alias.map(a => `+${a}`).join(' ');
                }

                let options = '';
                if (command.hasOwnProperty('options')) {
                    options = ' => Options: ' + command.options.map(o => `+${o}`).join(' ');
                }

                help_embed.addField(`+${command.name}${aliases}${options}`, `${command.description}`, false);
            }

            pages.push(help_embed);
            page_num++;
        }


        // help_embed.addField('\u200B', '\u200B', false);

        // for (const file of commandFiles) {
        //     const command = require(`./${file}`);

        //     if (command.hasOwnProperty('active_service')) { // dont show services to non admins TODO
        //         let active = command.active_service ? 'This service is active.' : 'This service is down.';
        //         help_embed.addField(`${command.name.charAt(0).toUpperCase()}${command.name.slice(1)}`, `${active}`, false);
        //     }
        // }


        await require('../utility/pagination').paginationEmbed(msg, pages);
    }
}