const fs = require('fs');
require('dotenv').config(); // .env values
const { diff, addedDiff, deletedDiff, updatedDiff, detailedDiff } = require('deep-object-diff');

const { Client, Collection, MessageEmbed } = require('discord.js');
const discord_client = new Client({ intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS', 'DIRECT_MESSAGES'], partials: ['MESSAGE', 'CHANNEL'] });


discord_client.commands = new Collection();

let prefix = '+';
let run_type = 'production';

module.exports = { prefix: prefix }

const commandFiles = fs.readdirSync('./src/commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  discord_client.commands.set(command.name, command);
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

  if (msg.guildId === null) {
    msg.channel.send(`Direct message commands aren't supported yet.`);
    return;
  }
  else if (msg.content.startsWith(prefix)) {
    const args = msg.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    // if (!msg.member.roles.cache.some(role => role.name === 'Mods') && msg.channel.name != 'commands' && command.name != 'topic') return;

    try {
      if (discord_client.commands.get(command).type != run_type) return;

      if (msg.member.roles.cache.some(role => role.name === 'Mods')) {
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
      console.error(err);
    }
    return;
  }
});

discord_client.login(process.env.discord_token);