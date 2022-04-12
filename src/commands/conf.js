// const Discord = require('discord.js');
// const discord_client = new Discord.Client();
// require('dotenv').config();

// module.exports = {
//   name: 'conf',
//   description: "confess anonymously",
//   admin: false,
//   type: "test",
//   execute(message, args, admin) {
//     // TODO: https://www.npmjs.com/package/wordpos
//     // TODO: https://www.npmjs.com/package/spotify-url-info
//     // TODO: add another level of identity abstraction
//     // TODO: support multiple attachments, support discord gifs, support saved gifs
//     // TODO: mutually exclusive reserved alias
//     if (message.content.length > 2000) {
//       message.channel.send("This message is too long. Send in parts.");
//       return;
//     }

//     //discord_confessions = discord_client.channels.cache.get(process.env.confessions_id);

//     let date = new Date();
//     let obf_id = ((message.author.id * 23 * date.getDate() * (date.getMonth() + 1)) % 1000000).toString().slice(0, 6);

//     let confessEmbed = new Discord.MessageEmbed()
//       .setColor(`#${obf_id}`)
//       .setTitle(`user_id: ${obf_id}`)
//       .setDescription(`${message}`)
//       .setFooter(`${date.toDateString()}`)
//       .setTimestamp();

//     //discord_confessions.send(confessEmbed);
//     return;
//   }
// }

require('dotenv').config(); // .env values
const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'conf',
  description: "confess things anonymously",
  admin: false,
  type: "final",
  execute(msg, run_type) {
    if (run_type != this.type) return;

    let channel = msg.client.guilds.cache.get(process.env.server_id).channels.cache.get(process.env.discord_bot_log_id);

    let date = new Date();
    let obf_id = ((msg.author.id * 23 * date.getDate() * (date.getMonth() + 1)) % 1000000).toString().slice(0, 6);

    let confessEmbed = new MessageEmbed()
      .setColor(`#${obf_id}`)
      .setTitle(`user_id: ${obf_id}`)
      .setDescription(`${msg.content}`)
      .setFooter({ text: date.toDateString()})
      .setTimestamp();

    // if (msg.attachments.size > 1) {

    // }
    // for (let [key, value] of msg.attachments) {
    //   try {
    //     confessEmbed.setImage(value.url);
    //   }
    //   catch (e) {
    //     console.log(e);
    //   }
    // }

    channel.send({ embeds: [confessEmbed] });

    return;
  }
}