require('dotenv').config(); // .env values
const { MessageEmbed } = require('discord.js');
const { uniqueNamesGenerator, adjectives, colors, animals, countries, names, languages, starWars } = require('unique-names-generator');
let randomColor = require('randomcolor');

module.exports = {
  name: 'confessions',
  description: "confess things anonymously",
  admin: false,
  type: "final",
  active_service: true,
  async execute(discord_client, msg) {
    if (!this.active_service) {
      msg.channel.send("Confessions is currently down for maintenance.")
      return;
    }

    let server = discord_client.guilds.cache.get(process.env.server_id);
    let users = await server.members.fetch()
    let user = users.find(m => m.id === msg.author.id);

    if (!user._roles.includes(process.env.confessions_role_id)) {
      msg.channel.send('You need the confessions role to confess. Go to #commands and type this -> .confessions');
      return;
    }

    if (Number.isInteger(user.communicationDisabledUntilTimestamp) && user.communicationDisabledUntilTimestamp - Date.now() > 0) {
      msg.channel.send("You'll be able to confess when your timeout ends.");
      return;
    }

    let { getBanList } = require('./ban_list.js');
    let ban_list = await getBanList();
    if (ban_list.includes(user.user.id)) {
      msg.channel.send("You're currently banned from confessions. If you have any questions, ask Sore.");
      return;
    }

    if (msg.content.length > 2000) {
      msg.channel.send("This message is too long. Send in parts.");
      return;
    }

    let channel = msg.client.guilds.cache.get(process.env.server_id).channels.cache.get(process.env.confessions_channel_id);

    let date = new Date();
    let day_secret = await this.secret(date.getDate());
    let month_secret = await this.secret(date.getMonth() + 1);
    let obf_id = ((msg.author.id * day_secret * month_secret) % 1000000).toString().slice(0, 6);

    // let generatedName = uniqueNamesGenerator({
    //   dictionaries: [adjectives, animals],
    //   length: 2,
    //   seed: obf_id,
    // });

    let confessEmbed = new MessageEmbed()
      .setColor(randomColor({ seed: obf_id }))
      .setTitle(`ID: ${obf_id}`)
      .setDescription(`${msg.content}`)
      .setFooter({ text: `ID: ${obf_id}` })
      .setTimestamp();

    try {
      msg.attachments.forEach(a => confessEmbed.setImage(a.url));
    }
    catch (err) {
      console.log(err);
    }

    channel.send({ embeds: [confessEmbed] });

    return;
  },
  async secret(num) {
    let secrets = [149, 211, 331, 137, 359, 97, 479, 7, 491, 353, 5, 17, 19, 509, 257, 239, 347, 47, 269, 421, 31, 499, 191, 13, 83, 461, 311, 379, 229, 487, 457];
    return secrets[num - 1];
  },
  async service_toggle() {
    this.active_service = !this.active_service;
  }
}