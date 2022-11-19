const fs = require('fs');
require('dotenv').config(); // .env values

require('lodash.permutations');
let _ = require('lodash');

const { Client, Collection, MessageEmbed } = require('discord.js');
const { options } = require('./commands/collection');
const discord_client = new Client({ intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS', 'DIRECT_MESSAGES', 'GUILD_MESSAGE_REACTIONS'], partials: ['MESSAGE', 'CHANNEL'] });

// let character_chats = ['1035708973606781018', '1035709358832627762', '1035709324351258734', '1035709358832627762', '1036000040159817849'];

discord_client.commands = new Collection();

let prefix = '+';
let run_type = 'production';

module.exports = { prefix: prefix }

const commandFiles = fs.readdirSync('./src/commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  let poss_cmd_names = command.hasOwnProperty('alias') ? [command.name, ...command.alias] : [command.name];
  let poss_cmd_options = command.hasOwnProperty('options') ? [[], ..._.flatMap(command.options, (v, i, a) => _.permutations(a, i + 1))] : [[]];

  for (let name of poss_cmd_names) {
    for (let option of poss_cmd_options) {
      discord_client.commands.set(name + option.join(''), command);
    }
  }
}

discord_client.on('ready', async () => {
  console.log(`----------------------${discord_client.user.username} Online----------------------`);
  discord_client.user.setActivity("with Code", { type: 'PLAYING' });

  fs.promises.writeFile('service-account.json', process.env.service_account);

  if (process.env.USERDOMAIN == 'DESKTOP-UI1NSUQ') {
    run_type = 'test';
  }
  else {
    const bot_log = discord_client.channels.cache.get(process.env.discord_bot_log_id);
    bot_log.send({
      embeds:
        [new MessageEmbed()
          .setColor(`#000000`)
          .setTitle(`System Restart`)
          .setDescription(`run_env: **${run_type}**`)
          .setFooter({ text: `Beans Staff Message` })
          .setTimestamp()]
    });
  }
});

discord_client.on('messageCreate', async msg => {
  if (msg.author.bot) return;

  // if (character_chats.includes(msg.channel.id)) {
  //   try {
  //     if (discord_client.commands.get('character').type != run_type) return;
  //     discord_client.commands.get('character').execute(discord_client, msg);
  //   }
  //   catch (err) {
  //     // console.log(err);
  //   }
  //   return;
  // }

  if (((msg.content.toLowerCase().includes('the game') && msg.content.toLowerCase().includes('||')) || msg.content.toLowerCase().includes('whore') || (msg.content.toLowerCase().includes('thegame') && msg.content.toLowerCase().includes('||'))) && msg.guildId != null) {
    try {
      await msg.member.disableCommunicationUntil(Date.now() + (5 * 60 * 1000), 'Sinners must die.');
      msg.channel.send(`This user has been timed out and will return <t:${Math.trunc((Date.now() + (5 * 60 * 1000)) / 1000)}:R>`);
    }
    catch (err) {
    }
    return;
  }

  if (msg.guildId === null) {
    msg.channel.send(`Direct message commands aren't supported yet.`);
    return;
  }
  else if (msg.content.startsWith(prefix)) {
    const args = msg.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if (msg.channel.name != 'commands' && command != 'topic' && command != 'koth' && msg.author.id != '183019001058689025') return; // owner : (await msg.guild.fetchOwner()).user.id

    try {
      if (discord_client.commands.get(command).type != run_type) return;

      if (msg.member.roles.cache.some(role => role.name.toLowerCase() === 'admins' || role.name.toLowerCase() === 'mods')) {
        discord_client.commands.get(command).execute(discord_client, msg, args, true);
      }
      else {
        if (discord_client.commands.get(command).admin) {
          msg.channel.send("This is an admin command.");
        }
        else {
          discord_client.commands.get(command).execute(discord_client, msg, args, false);
        }
      }
    }
    catch (err) {
      // console.error(err);
    }
  }
});

discord_client.login(process.env.discord_token);