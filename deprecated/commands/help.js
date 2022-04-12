module.exports = {
    name: 'help',
    description: "gives you descriptions of all commands",
    admin: false,
    type: "final",
    execute(message, args, admin) {
        const index = require('../index.js').execute();

        //console.log(index.discord_client.commands);

        let commandsEmbed = new index.Discord.MessageEmbed()
            .setTitle(`+help`)
            .setDescription(`+help <command> | +help <commands>`)
            .setColor(`#000000`)
            .setFooter(`-`)
            .setTimestamp();

        if (args.length >= 1) {
            for (let i = 0; i < args.length; i++) {

            }
        }
        else {
            for (command of index.discord_client.commands) {
                if (command[0] == 'help' || command[0] == 'conf' || command[1].type == 'test' || command[0] == 'hydro' || command[0] == 'zee') {

                }
                else {
                    if (admin) {
                        if (command[1].admin) {
                            commandsEmbed.addField(`${command[0]} - Admin`, `${command[1].description}`, false);
                        }
                        else {
                            commandsEmbed.addField(`${command[0]}`, `${command[1].description}`, false);
                        }
                    }
                    else {
                        if (!command[1].admin)
                        {
                            commandsEmbed.addField(`${command[0]}`, `${command[1].description}`, false);
                        }
                    }
                }
            }
            message.channel.send(commandsEmbed);
        }
    }
}