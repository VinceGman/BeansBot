const fs = require('fs');
require('dotenv').config(); // .env values
const { diff, addedDiff, deletedDiff, updatedDiff, detailedDiff } = require('deep-object-diff');

const { Client, Collection } = require('discord.js');
const discord_client = new Client({ intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS', 'DIRECT_MESSAGES'], partials: ['MESSAGE', 'CHANNEL'] });


discord_client.commands = new Collection();

let prefix = '+';
let run_type = 'final';

const commandFiles = fs.readdirSync('./src/commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  discord_client.commands.set(command.name, command);
}


discord_client.on('ready', async () => {
  console.log(`----------------------${discord_client.user.username} Online----------------------`);
  discord_client.user.setActivity("with code", { type: 'PLAYING' });
  
  const server = discord_client.guilds.cache.get(process.env.server_id);
  let members = await server.members.fetch();

  // let commands = server.commands;

  // commands.create({
  //   name: 'marco',
  //   description: 'marco polo',
  // });

  if (process.env.USERDOMAIN == 'DESKTOP-UI1NSUQ') {
    run_type = 'test';
  }
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

      if (msg.member.roles.cache.some(role => role.name === 'Mods') || msg.member.roles.cache.some(role => role.id == process.env.admin_role_id)) {
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