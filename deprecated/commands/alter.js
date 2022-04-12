const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/beans.db');

module.exports = {
    name: 'alter',
    description: "anon profile",
    admin: false,
    type: "test",
    execute(message, args, admin) {

        let tag = 'Asami';
        let image = 'https://i.pinimg.com/originals/10/91/94/1091948c6b80b65b9eef8c163f0ae42a.jpg'
        let color = '#FFFFFF';

        const index = require('../index.js').execute();

        const alterEmbed = new index.Discord.MessageEmbed()
            .setColor(color)
            .setAuthor(tag, image)
            .setDescription('This is sample text that displays what your message and alter will look like when you post.')
            .setTimestamp()
            .addField('Status', 'On', false)
            .setFooter(`ID: 354240`);/*${obf_id}*/

        switch (args[0]) {
            case 'on':
                console.log('alter on');
                break;
            case 'off':
                console.log('alter off');
                break;
            case 'color':
                console.log('alter color change');
                break;
            case 'image':
                console.log('alter image change');
                break;
            case 'tag':
                console.log('alter tag change');
                break;
            default:
                console.log('showing alter');
                index.discord_bot_log.send(alterEmbed);
        }

        db.serialize(async () => {
            db.get('SELECT * FROM blob', [], async (err, stringify) => {
                if (err) {
                    message.channel.send("Fetching Problem.");
                    return;
                }
                else {
                    console.log('achieved data');
                    console.log(JSON.parse(stringify));
                }
            });
        });
    }
}