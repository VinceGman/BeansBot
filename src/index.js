const fs = require('fs');
require('dotenv').config(); // .env values

require('lodash.permutations');
let _ = require('lodash');

const { Client, Collection, MessageEmbed } = require('discord.js');
const discord_client = new Client({ intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS', 'DIRECT_MESSAGES', 'GUILD_MESSAGE_REACTIONS'], partials: ['MESSAGE', 'CHANNEL'] });

let prefix = '+';
let run_type = 'production';

module.exports = { prefix: prefix, run_type: run_type }

discord_client.commands = new Collection();
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

  if (process.env.USERDOMAIN == 'CYBER') {
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

  if (msg.guildId === null) {
    msg.channel.send(`Direct message commands aren't supported yet.`);
    return;
  }
  else if (msg.content.startsWith(prefix)) {
    const args = msg.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    let admin = false;
    let execute = false;

    try {
      if (discord_client.commands.get(command).type != run_type) return;
      if (msg.member.roles.cache.some(role => role.name.toLowerCase() === 'admins' || role.name.toLowerCase() === 'mods')) admin = true;

      for (let scope of discord_client.commands.get(command).scopes ?? ['commands']) {
        if (scope == 'commands' && (msg.channel.name == 'commands' || msg.channel.name == 'bot_log')) execute = true;
        if (scope == 'global') execute = true;
        if (msg.channel.id == scope) execute = true;
      }

      if (!execute) return;
      discord_client.commands.get(command).execute(discord_client, msg, args, admin);
    }
    catch (err) {
      // console.error(err);
    }
  }
});

discord_client.login(process.env.discord_token);