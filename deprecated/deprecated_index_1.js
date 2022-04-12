const Discord = require('discord.js');
//const { containeranalysis_v1alpha1 } = require('googleapis');
const discord_client = new Discord.Client();
require('dotenv').config(); // .env package + config to load the .env file values

// let starting_currency = 2000;

let discord_server;
let discord_bot_log;

// Login
discord_client.login(process.env.discord_token);

discord_client.on('ready', () => {
  // Set Discord Client Activity
  discord_client.user.setActivity("dm me a confession");

  // Setup Server + Bot Log
  discord_server = discord_client.guilds.cache.find(guild => guild.id === process.env.server_id);
  discord_bot_log = discord_client.channels.cache.get(process.env.discord_bot_log_id);
  discord_confessions = discord_client.channels.cache.get(process.env.confessions_id);
  // main = discord_client.channels.cache.get("887429951299682308");

  // Online Notifications
  console.log("Beans Online!");
  //discord_bot_log.send("Beans Online!");

  // Connect Clients
  // twitch_client.connect().catch((error) => { discord_bot_log.send(`Twitch Error: ${error}`) });
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

// const tmi = require('tmi.js');
// let twitch_account = "soreemperor";

// const twitch_client = new tmi.Client({
//   options: { debug: false, messagesLogLevel: "info" },
//   connection: {
//     reconnect: true,
//     secure: true
//   },
//   identity: {
//     username: twitch_account,
//     password: process.env[`${twitch_account}_oauth`]
//   },
//   channels: ['hydrione', 'kappaone', 'wingotv', 'inguyen', 'soreemperor', 'kiyoit', 'artificiaIlyflavored']
// });

// twitch_client.on('connected', () => {
//   // discord_bot_log.send(`Beans -> Twitch : Session (${new Date()})`);
//   // connect_google();
// });

// twitch_client.on('action', (channel, userstate, message, self) => {
//   if (self) return;
// });

// twitch_client.on('message', async (channel, tags, message, self) => {

//   //let discord_twitch_chat = discord_client.channels.cache.get(process.env.discord_twitch_chat_id);
//   let streamEmbed;

//   if (self) return;
//   if (tags.username.toLowerCase() === "nightbot") return;
//   if (tags.username.toLowerCase() === "streamelements") return;
//   if (tags.username.toLowerCase() === "streamlabs") return;
//   //if (tags.username.toLowerCase() === "") return;

//   if (message.toLowerCase().includes('buy followers')) {
//     console.log(`Banned: ${tags['display-name']}`);
//     twitch_client.say(channel, `/ban ${tags.username.toLowerCase()}`);
//     streamEmbed = new Discord.MessageEmbed()
//       .setColor(tags.color)
//       .setTitle(tags['display-name'])
//       .setDescription(`User Banned\n\n${message}`)
//       .setTimestamp()
//       .setFooter(`Stream: ${channel}`);

//     discord_bot_log.send(streamEmbed);
//     return;
//   }
// });

discord_client.on('message', msg => {
  if (msg.author.id != process.env.bot_id && msg.author.bot == false && msg.channel.type === 'dm') {
    // if (!msg.member.roles.cache.find(r => r.name === "Registered" || r == process.env.registered_role_id)) {
    //   //register(msg);
    // }

    let date = new Date();

    let obf_id = ((msg.author.id * 23 * date.getDate() * (date.getMonth() + 1)) % 1000000).toString().slice(0, 6);

    let confessEmbed = new Discord.MessageEmbed()
      .setColor(`#${obf_id}`)
      .setTitle(`user_id: ${obf_id}`)
      .setDescription(`${msg}`)
      .setFooter(`${date.toDateString()}`)
      .setTimestamp();
    
    console.log(msg);

    if (msg.attachments.size > 1)
    {
      
    }
    for (let [key, value] of msg.attachments) {
      try {
        confessEmbed.setThumbnail(value.url);
      }
      catch (e) {
        console.log(e);
      }
    }

    discord_confessions.send(confessEmbed);

    return;
  }
});

// async function register(msg) {
//   let user = msg.author;
//   msg.member.roles.add(msg.guild.roles.cache.find(r => r.name === "Registered" || r == process.env.registered_role_id));
//   await googleSheets.spreadsheets.values.append({
//     auth,
//     spreadsheetId,
//     range: "Users!A:C",
//     valueInputOption: "USER_ENTERED",
//     resource: {
//       values: [[user.id, user.username, starting_currency]],
//     },
//   });
// }