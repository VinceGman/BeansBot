const fs = require('fs');
require('dotenv').config(); // .env values
const { diff, addedDiff, deletedDiff, updatedDiff, detailedDiff } = require('deep-object-diff');

const { Client, Collection } = require('discord.js');
const discord_client = new Client({ intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS', 'DIRECT_MESSAGES'], partials: ['MESSAGE', 'CHANNEL'] });


discord_client.commands = new Collection();

const commandFiles = fs.readdirSync('./src/commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  discord_client.commands.set(command.name, command);
}


discord_client.on('ready', () => {
  console.log(`----------------------${discord_client.user.username} Online----------------------`);
  discord_client.user.setActivity("with code", { type: 'PLAYING' });

  const server = discord_client.guilds.cache.get(process.env.server_id);
  //console.log(server.name);

  //let commands = server.commands;

  // commands.create({
  //   name: 'marco',
  //   description: 'marco polo',
  // });
});

// discord_client.on('interactionCreate', async interaction => {
//   if (!interaction.isCommand()) return;

//   if (interaction.commandName === 'marco') {
//     await interaction.reply('polo');
//   }
// });

discord_client.on('messageCreate', async msg => {
  //console.log(detailedDiff(msg.author, discord_client.guilds.cache.get(msg.guildId).members.cache.get(msg.author.id)));
  //console.log(discord_client.guilds.cache.get(msg.guildId).members.cache.get(msg.author.id));
  if (msg.author.bot) return;

  if (msg.guildId === null) {
    try {
      //msg.channel.send("Nice try bitch.");
      //console.log(`${msg.author.username}: ${msg.content}`);
      discord_client.commands.get('conf').execute(msg, 'final');
    }
    catch (err) {
      msg.channel.send("Confessions don't work right now or something went wrong with this message.");
    }

    return;

  }
});

discord_client.login(process.env.discord_token);