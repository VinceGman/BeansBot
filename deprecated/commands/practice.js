module.exports = {
    name: 'practice',
    description: "work on confess testing",
    admin: false,
    type: "test",
    execute(message, args, admin) {
        // TODO: https://www.npmjs.com/package/wordpos
        // TODO: https://www.npmjs.com/package/spotify-url-info
        // TODO: add another level of identity abstraction
        // TODO: support multiple attachments, support discord gifs, support saved gifs
        // TODO: mutually exclusive reserved alias
        if (message.content.length > 2000) {
            message.channel.send("This message is too long. Send in parts.");
            return;
        }

        const index = require('../index.js').execute();

        let date = new Date();
        let obf_id = ((message.author.id * 23 * date.getDate() * (date.getMonth() + 1)) % 1000000).toString().slice(0, 6);

        let confessEmbed = new index.Discord.MessageEmbed()
            .setColor(`#${obf_id}`)
            .setTitle(`user_id: TEST`)
            .setDescription(`${message}`)
            .setFooter(`${date.toDateString()}`)
            .setTimestamp();

        if (message.content.split(' ').length == 1 && message.content.includes('https://') && (message.content.includes('gif') || message.content.includes('tenor'))) {
            try {
                confessEmbed.setImage(message.content);
                confessEmbed.setDescription('');
                index.discord_confessions.send(confessEmbed);
                return;
            }
            catch (e) {
                message.channel.send("Something went wrong with the attachment.");
                return;
            }
        }


        if (message.attachments.size > 0) {
            if (message.content.length > 0)
            {
                index.discord_confessions.send(confessEmbed);
                confessEmbed.setDescription('');
            }
            for (let [key, value] of message.attachments) {
                try {
                    if (value.url.includes('.jpg') || value.url.includes('.png') || value.url.includes('.gif')) {
                        confessEmbed.setImage(value.url);
                        index.discord_confessions.send(confessEmbed);
                    }
                    else {
                        message.channel.send("Supported Attachment Formats: '.jpg' | '.png' | '.gif'");
                    }
                }
                catch (e) {
                    console.log(e);
                }
            }
            return;
        }

        index.discord_confessions.send(confessEmbed);
        return;
    }
}

// try {
//     confessEmbed.setImage([...message.attachments][0][1].url);
// }
// catch (e) {
//     message.channel.send("This attachment format is not supported yet.");
//     return;
// }