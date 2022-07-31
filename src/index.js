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

// var CronJob = require('cron').CronJob;
// var job = new CronJob(
// 	'0 18 * * *',
// 	function() {
// 		console.log('It is now noon.');
// 	},
// 	null,
// 	false,
// 	'America/Phoenix'
// );
// job.start();


discord_client.on('ready', async () => {
  console.log(`----------------------${discord_client.user.username} Online----------------------`);
  discord_client.user.setActivity("with her feelings", { type: 'PLAYING' });

  fs.promises.writeFile('service-account.json', process.env.service_account);
  // const server = discord_client.guilds.cache.get(process.env.server_id);
  // let members = await server.members.fetch();


  // const channel = discord_client.channels.cache.get('955489802600464507');

  // // Create message pointer
  // let message = await channel.messages
  //   .fetch({ limit: 1 })
  //   .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

  // let count = 0;
  // while (message && count <= 1000) {
  //   await channel.messages
  //     .fetch({ limit: 100, before: message.id })
  //     .then(messagePage => {
  //       messagePage.forEach(msg => {
  //         count += 100;
  //         console.log('processed: 100 more messages');
  //         // do shit
  //       });

  //       // Update our message pointer to be last message in page of messages
  //       message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
  //     });
  // }



  // const s5_server = discord_client.guilds.cache.get(process.env.server_id);
  // let s5_roles = await s5_server.roles.fetch();
  // let swap = false; 
  // s5_roles.forEach(r => {
  //   if (r.name.includes('Level')) {
  //     r.edit({ hoist: swap });
  //   }
  //   else if (r.name.includes('Color')) {
  //     r.edit({ hoist: !swap })
  //   }
  // });

  // let commands = server.commands;

  // commands.create({
  //   name: 'marco',
  //   description: 'marco polo',
  // });

  if (process.env.USERDOMAIN == 'DESKTOP-UI1NSUQ') {
    run_type = 'test';
  }

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
});

// discord_client.on('interactionCreate', async interaction => {
//   if (!interaction.isCommand()) return;

//   if (interaction.commandName === 'marco') {
//     await interaction.reply({content: 'polo', ephemeral: true});
//   }
// });

discord_client.on('messageCreate', async msg => {
  if (msg.author.bot) return;

  if (msg.guildId === null) {
    try {
      if (discord_client.commands.get('confessions').type != run_type) return;
      discord_client.commands.get('confessions').execute(discord_client, msg);
    }
    catch (err) {
      msg.channel.send("Confessions don't work right now or something went wrong with this message.");
    }
    return;
  }
  else if (msg.content.startsWith(prefix)) {
    const args = msg.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    try {
      if (discord_client.commands.get(command).type != run_type) return;

      if (msg.member.roles.cache.some(role => role.name === 'Mods' || role.id == process.env.admin_role_id)) {
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
      msg.channel.send(`This is not a command. See **${prefix}help** for commands.`);
      console.error(err);
    }
    return;
  }
});

discord_client.login(process.env.discord_token);