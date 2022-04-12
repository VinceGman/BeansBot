const { diff, addedDiff, deletedDiff, updatedDiff, detailedDiff } = require('deep-object-diff');

const Discord = require('discord.js');
const allIntents = new Intents(32767);
const discord_client = new Discord.Client({ allIntents });

const process = require('process');
// const { run } = require('googleapis/build/src/apis/run');
require('dotenv').config(); // .env package + config to load the .env file values
const fs = require('fs');

module.exports = {
  name: 'index',
  description: "meta-data",
  execute() {
    return {
      Discord: Discord,
      discord_server: discord_server,
      discord_client: discord_client,
      discord_bot_log: discord_bot_log,
      discord_confessions: discord_confessions,
      run_type: run_type,
    }
  }
}

stocks = [
  {
    'ticker': 'CFN',
    'name': 'Coffee Beans',
    'description': 'Coffee Beans is the leading company in the professional and consumer coffee market. They manufacture and sell not only many different types and roasts of coffee beans, but also a large share of coffee centric electronics.',
    'id': 80,
  },
  {
    'ticker': 'RCE',
    'name': 'Frijoles con Arroz',
    'description': "Frijoles con Arroz is a company that started out selling both rice and beans. They've slowly pulled out of the beans market and have had vast success in the rice selling market. They sell many types of rice.",
    'id': 232,
  },
  {
    'ticker': 'SLV',
    'name': 'Indentured Robots',
    'description': "Indentured Robots Inc. found their start in AI and Discord Bot development. They create mini AI agents to run various Discord Servers and act as 'E-Girls' in various online games, mainly Riot's Team Fight Tactics.",
    'id': 90,
  },
  {
    'ticker': 'PRS',
    'name': 'Paris Entertainment',
    'description': "A French based company, Paris Entertainment boasts the largest artist catalogue of African creators in all fields. Currently, their strongest holdings are in the performing arts of music and dance.",
    'id': 48543,
  },
  {
    'ticker': 'PRN',
    'name': 'Paris Recreational Network',
    'description': "The sister corporation of Paris Entertainment, PRN invests in athletes and models to further the diversity and inclusion of Africans in entertainment as a whole.",
    'id': 47304,
  },
  {
    'ticker': 'NBI',
    'name': 'No Bitches Incorporated',
    'description': "NO BITCHES? NBI has you covered. As the leading dating app, we've outperformed other dating applications like Famers Only and Grindr. NBI is dedicated to finding all the possible bitches you could ever ask for. Short bitches? We got you. Tall bitches? Best bet. Thicc bitches? You're trippin if you think you can pull somethin like that but we'll hook you up anyway.",
    'id': 118,
  },
  {
    'ticker': 'GRL',
    'name': 'Girlboss Enterprises',
    'description': "Do you want a CEO Mommy GF making more than twice your income? Then Girlboss Enterprises is the company for you to invest in, the company is based. It's not just based, but it's based on the idea of men being malewives. The company boasts a 100% female employee count with minimum salaries starting at twice their significant other's income.",
    'id': 46018,
  },
];

// for (id in stocks) {
//   console.log(stocks[id].ticker, stocks[id].name,'\n', stocks[id].description, '\n');
//   //console.log(stock.ticker, stock.name, stock.description);
// }

// DATABASE

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/beans.db');

// db.serialize(function() {
//   //db.run("CREATE TABLE IF NOT EXISTS beans (id INTEGER), (username TEXT), (credits REAL)");

//   //var stmt = db.prepare("INSERT INTO beans VALUES (?)");
//   for (members in discord_server) {
//       stmt.run("Ipsum " + i);
//   }
//   //stmt.finalize();

// // db.each("SELECT id, credits FROM beans", (err, row) => { //SELECT rowid AS anything
// //   console.log(row.id + ": " + row.credits);
// // });

//   // db.run("DROP TABLE lorem");
// });

//  

// DATABASE

let run_type = "";

discord_client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  discord_client.commands.set(command.name, command);
}

let discord_bot_log;
let discord_server;

let prefix = "+";

// Login
discord_client.login(process.env.discord_token);

discord_client.on('ready', () => {
  // Set Discord Client Activity
  discord_client.user.setActivity("with code", { type: 'PLAYING' });

  // Setup Server + Bot Log
  discord_server = discord_client.guilds.cache.get(process.env.server_id);
  discord_bot_log = discord_client.channels.cache.get(process.env.discord_bot_log_id);
  discord_log = discord_client.channels.cache.get(process.env.discord_log_id);
  discord_confessions = discord_client.channels.cache.get(process.env.confessions_id);

  // Online Notifications
  console.log("Beans Online!");

  try {
    if (process.env.HOME == 'C:\\Users\\Vince') {
      run_type = 'test';
    }
    else if (process.env.HOME == '/root') {
      run_type = 'final';
    }
    else {
      run_type = 'invalid';
    }
  }
  catch (e) {
    process.exit();
  }

  // discord_bot_log.send(`RunType: ${run_type} environment`);

  // Connect Clients
  twitch_client.connect().catch((error) => { discord_bot_log.send(`Twitch Error: ${error}`) });

  db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS beans (id TEXT PRIMARY KEY, credits REAL)");
    db.run("CREATE TABLE IF NOT EXISTS inventory (id TEXT, quantity INTEGER, itemname TEXT, price REAL, type TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS stocks (ticker TEXT PRIMARY KEY, name TEXT, description TEXT, id INTEGER)");
    db.run("CREATE TABLE IF NOT EXISTS blob (obj TEXT)");

    var stmt = db.prepare("INSERT INTO beans VALUES (?, ?)");
    for (member of discord_server.members.cache) {
      stmt.run(member[1].id, 2000.00, (err) => {
        if (err) {
          // console.log('This user is already in the system.');
        }
      });
    }
    stmt.finalize();

    var stck = db.prepare("INSERT INTO stocks VALUES (?, ?, ?, ?)");
    for (tick of stocks) {
      stck.run(tick.ticker, tick.name, tick.description, tick.id, (err) => {
        if (err) {
          // console.log('This user is already in the system.');
        }
      });
    }
    stck.finalize();

    // const Spotify = require('spotify-api.js');
    // const spotify_client = new Spotify.Client({ token: "" });
    // //const spotify_client = new Spotify.Client();

    // spotify_client.login(process.env.spotify_id, process.env.spotify_secret).then(async () => {
    //   //console.log(await spotify_client.search('drake redemption', { limit: 20, type: ['track'] }));
    // });

    // spotify_client.login({
    //   clientID: 'id', // Your app client id
    //   clientSecret: 'secret', // Your app client secret
    //   code: 'code',  // To get new one, enter the code received by spotify api
    //   redirectURL: 'redirect url' // Redirect url which you used while auth, which is only for verification
    // }).then(async ({ refreshToken }) => {
    //   console.log(`Login successful! Refresh token: ${refreshToken}`);
    //   console.log(await spotify_client.tracks.get('id'));
    // })

    // // The same but refreshes token instead of getting a new one
    // spotify_client.login({
    //   clientID: process.env.spotify_id, // Your app client id
    //   clientSecret: process.env.spotify_secret, // Your app client secret
    //   refreshToken: 'token', // Use a refresh token instead of a code
    //   redirectURL: 'redirect url' // Redirect url which you used while auth, which is only for verification
    // }).then(async ({ refreshToken }) => {
    //   console.log(`Login successful! Refresh token: ${refreshToken}`);
    //   console.log(await spotify_client.tracks.get('id'));
    // })

    // const search = await spotify_client.search('Some query', { limit: 20, type: ['track'] });
    // console.log(search.tracks.items);

    // const playback = await spotify_client.user.player.getCurrentPlayback(); // Get current user's current playback
    // const devices = await spotify_client.user.player.getDevices(); // Get all the devices where the account is logged in
    // const currentlyPlaying = await spotify_client.user.player.getCurrentlyPlaying(); // Get whats currently playing on the player of the current user!
    // const recentlyPlayed = await spotify_client.user.player.getRecentlyPlayed(); // Returns the history of the player of the current user!

    // await spotify_client.user.player.transferPlayback(['device_id'], { play: true }); // Transfer the current playback to other devices
    // await spotify_client.user.player.play(); // Plays the player of the current user
    // await spotify_client.user.player.pause(); // Pauses the player of the current user
    // await spotify_client.user.player.next(); // Skips to the next track in the current user's player queue
    // await spotify_client.user.player.previous(); // Skips to the previous track in the current user's player queue
    // await spotify_client.user.player.seek(1200); // Seek to a positionf of the item of the player of the current user
    // await spotify_client.user.player.setRepeatMode('track'); // Set repeat mode for the player
    // await spotify_client.user.player.setVolume(30); // Set volume to the player
    // await spotify_client.user.player.shuffle(); // Shuffle the player queue
    // await spotify_client.user.player.shuffle(false); // Unshuffle the player queue
    // await spotify_client.user.player.addItem('spotify:track:id'); // Add an item to the queue

  });

  // db.run('INSERT INTO inventory VALUES (?, ?, ?, ?, ?)', ['183019001058689025', 25, "SLV", 75, 'stock'], (err) => {
  //   if (err) {
  //     // console.log(err);
  //   }
  // });

  // let proper_obj = {a: 1, b: 2, c: 3};

  // db.run('INSERT INTO blob VALUES (?)', [JSON.stringify(proper_obj)], (err) => {
  //   if (err) {
  //     // console.log(err);
  //   }
  // });

  // db.all('SELECT * FROM scores WHERE id = ?',[message.author.id], (err, row) => {       // id | avg_score | thing3 | thing4
  //   console.log(row);
  // });

  // db.run("UPDATE beans SET credits = 1000000000 WHERE id = 183019001058689025")
  // db.run('ALTER TABLE inventory ADD COLUMN type TEXT');
  // db.run('DROP TABLE stocks');


});

// let entries = {
//   id: 1,
//   username: 2,
// }


// let googleSheets, spreadsheetId;

// // Google Auth + Setup
// const { google } = require("googleapis");

// const auth = new google.auth.GoogleAuth({
//   keyFile: "credentials.json",
//   scopes: "https://www.googleapis.com/auth/spreadsheets",
// });

// async function connect_google() {
//   // Client Instance
//   const google_client = await auth.getClient();

//   // Google Sheets Instance
//   googleSheets = google.sheets({ version: "v4", auth: google_client });

//   spreadsheetId = "1rqsRHKrQ6RW7O3nzUglJWUgaqzyA__x_jvi0xWQROf0";

//   discord_bot_log.send(`Beans -> Google`);
// }

const tmi = require('tmi.js');
let twitch_account = "soreemperor";

const twitch_client = new tmi.Client({
  options: { debug: false, messagesLogLevel: "info" },
  connection: {
    reconnect: true,
    secure: true
  },
  identity: {
    username: twitch_account,
    password: process.env[`${twitch_account}_oauth`]
  },
  channels: ['soreemperor', 'akinnachan',] // 'hydrione', 'kappaone', 'wingotv', 'inguyen', 'kiyoit'
});

twitch_client.on('connected', () => {
  // discord_bot_log.send(`Beans -> Twitch : Session (${new Date()})`);
  // connect_google();
});

// twitch_client.on('action', (channel, userstate, message, self) => {
//   if (self) return;
// });

twitch_client.on('message', async (channel, tags, message, self) => {

  // let discord_twitch_chat = discord_client.channels.cache.get(process.env.discord_twitch_chat_id);
  // let streamEmbed;

  if (self) return;
  if (tags.username.toLowerCase() === "nightbot") return;
  if (tags.username.toLowerCase() === "streamelements") return;
  if (tags.username.toLowerCase() === "streamlabs") return;
  //if (tags.username.toLowerCase() === "") return;

  if (message.toLowerCase().includes('buy followers')) {
    // console.log(`Banned: ${tags['display-name']}`);
    twitch_client.say(channel, `/ban ${tags.username.toLowerCase()}`);
    twitch_client.say(channel, `${tags.username.toLowerCase()} banned by auto-mod.`);
    // streamEmbed = new Discord.MessageEmbed()
    //   .setColor(tags.color)
    //   .setTitle(tags['display-name'])
    //   .setDescription(`User Banned\n\n${message}`)
    //   .setTimestamp()
    //   .setFooter(`Stream: ${channel}`);

    // discord_bot_log.send(streamEmbed);
    return;
  }
  else if (message.toLowerCase().includes('primes and viewers on')) {
    twitch_client.say(channel, `/ban ${tags.username.toLowerCase()}`);
    twitch_client.say(channel, `${tags.username.toLowerCase()} banned by auto-mod.`);
    return;
  }
});

discord_client.on('message', msg => {
  if (msg.author.bot || msg.author.id == process.env.bot_id) {
    return;
  }
  else if (msg.content.startsWith(prefix)) {
    if (msg.channel.type === 'dm') {
      const args = msg.content.slice(prefix.length).split(/ +/);
      const command = args.shift().toLowerCase();
      if (command == 'alter') {
        discord_client.commands.get('alter').execute(msg, args, false);
      }
      else {
        msg.channel.send(`Only **${prefix}alter** works in DM.`);
      }
      return;
    }

    const args = msg.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    try {
      if (discord_client.commands.get(command).type != run_type) return;

      if (msg.member.roles.cache.some(role => role.name === 'Elders') || msg.member.roles.cache.some(role => role.id == process.env.admin_role_id)) {
        discord_client.commands.get(command).execute(msg, args, true);
      }
      else {
        if (discord_client.commands.get(command).admin) {
          msg.channel.send("This is an admin command.");
        }
        else {
          discord_client.commands.get(command).execute(msg, args, false);
        }
      }
    }
    catch (err) {
      msg.channel.send(`This is not a command. See **${prefix}help** for commands.`);
    }

    return;

  }
  else if (msg.channel.type === 'dm') {
    try {
      msg.channel.send("Nice try bitch.");
      console.log(`${msg.author.username}: ${msg.content}`);
      //discord_client.commands.get('conf').execute(msg, run_type);
    }
    catch (err) {
      //msg.channel.send("Confessions don't work right now or something went wrong with this message.");
    }

    return;

  }
  else if (msg.author.id == '140544571045183488' || msg.author.id == '916980376830894081') {
    const args = msg.content.slice(prefix.length).split(/ +/);
    discord_client.commands.get('hydro').execute(msg, args, true, true);
  }
  else if (msg.author.id == '201771967202852865') {
    const args = msg.content.slice(prefix.length).split(/ +/);
    discord_client.commands.get('zee').execute(msg, args, true, true);
  }
});

// guildMemberUpdate
/* Emitted whenever a guild member changes - i.e. new role, removed role, nickname.
PARAMETER    TYPE               DESCRIPTION
oldMember    GuildMember        The member before the update
newMember    GuildMember        The member after the update    */
discord_client.on("guildMemberUpdate", function (oldMember, newMember) {
  let diffObj = detailedDiff(oldMember, newMember); //newMember.communicationDisabledUntil, oldMember.communicationDisabledUntilTimestamp
  //console.log(newMember, diffObj);
  console.log(newMember.communicationDisabledUntilTimestamp);
  // for ([role, id] in diffObj.updated._roles) {
  //   let role = discord_server.roles.cache.find(role => role.id === id);
  //   console.log(role.name);
  // }

});


// function makeEmbed() {
//   const exampleEmbed = new Discord.MessageEmbed()
//     .setColor('#0099ff')
//     .setTitle('Some title')
//     .setURL('https://discord.js.org/')
//     .setAuthor('Some name', 'https://i.imgur.com/AfFp7pu.png', 'https://discord.js.org')
//     .setDescription('Some description here')
//     .setThumbnail('https://i.imgur.com/AfFp7pu.png')
//     .addFields(
//       { name: 'Regular field title 1', value: 'Some value here', inline: true },
//       { name: 'Regular field title 2', value: 'Some value here', inline: true },
//       { name: 'Regular field title 3', value: 'Some value here', inline: true },
//       { name: 'Regular field title 4', value: 'Some value here', inline: true },
//       { name: '\u200B', value: '\u200B' },
//       { name: 'Inline field title 1', value: 'Some value here', inline: true },
//       { name: 'Inline field title 2', value: 'Some value here', inline: true },
//     )
//     .addField('Inline field title 3', 'Some value here', true)
//     .setImage('https://i.imgur.com/AfFp7pu.png')
//     .setTimestamp()
//     .setFooter('Some footer text here', 'https://i.imgur.com/AfFp7pu.png');

//   return exampleEmbed;
// }


// function manageTwitchChannels(task, channel) {
//   switch (task) {
//     case 'add':
//       twitch_client.channels.push(channel);
//       discord_bot_log.send(`Added ${channel}`);
//       break;
//     case 'remove':
//       if (twitch_client.channels.includes(channel)) {
//         twitch_client.channels.splice(twitch_client.channels.indexOf(channel), 1);
//         discord_bot_log.send(`Removed ${channel}`);
//       } else {
//         discord_bot_log.send("This channel is not supported.");
//       }
//       break;
//     case 'show':
//       discord_bot_log.send(twitch_client.channels.join().split(',', " | "));
//       break;
//     default:
//       console.log('No Command');
//       break;
//   }
// }

// const sqlite3 = require('sqlite3');
// const { open } = require('sqlite');

// async function main() {
//     try {
//         sqlite3.verbose();
//         const ordersDb = await createDbConnection('./ProcessedOrders.db');
//         const orderProcessed = await orderAlreadyProcessed(ordersDb, "555");
//         console.log("orderProcessed = " + orderProcessed);
//         if (!orderProcessed) {
//             console.log("So condition is met!");
//         }
//     } catch (error) {
//         console.error(error);
//     }
// }


// async function orderAlreadyProcessed(ordersDb, orderNumberStr) {
//     try {
//         console.log('Starting orderAlreadyProcessed function');
//         const query = 'SELECT COUNT(SoldOrderNumber) as `recsCount` from ProcessedSoldOrders where SoldOrderNumber = ?;'
//         const row = await ordersDb.get(query, [orderNumberStr]);
//         console.log('Row with count =', row);
//         console.log('row.recsCount =', row.recsCount);
//         const result = typeof row !== 'undefined' && row.recsCount > 0;
//         console.log('Returning ' + result);
//         return result;
//     } catch (error) {
//         console.error(error);
//         throw error;
//     }
// }

// function createDbConnection(filename) {
//     return open({
//         filename,
//         driver: sqlite3.Database
//     });
// }

// main();