const tmi = require('tmi.js');
require('dotenv').config();
const { performance } = require('perf_hooks');

let user = 'Cooma';
let start, finish;

const client = new tmi.Client({
    options: { debug: false, messagesLogLevel: "info" },
    connection: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: process.env[`${user}_user`],
        password: process.env[`${user}_oauth`]
    },
    channels: ['hydrione']
});
client.connect().catch(console.log(`${user} online`));
client.on('connected', () => {
    //client.say('hoodiefrosty', `I might be able to make that happen.`);
});

client.on('message', (channel, tags, message, self) => {
    if (self) return;
    if (tags.username === '' && message.includes('!poll'))
    {
    }
    console.log('message received: ' + message);
});

  //let identity = '-\nUsername: ' + tags.username + ' | UserID: ' + tags['user-id'] + ' | Color: ' + tags.color;

  // let content = `${message}\n`;
  // //console.log(identity, `\n: ${content}`);

  // // await discord_server.members.cache.find(member => member.id === '792157930886660120').setNickname(tags.username)
  // // discord_twitch_chat.send(identity);
  // // discord_twitch_chat.send(content, { tts: true });

  // streamEmbed = new Discord.MessageEmbed()
  //   .setColor(tags.color)
  //   .setTitle(tags['display-name'])
  //   .setDescription(content)
  //   .setTimestamp()
  //   .setFooter(`Stream: ${channel}`);

  // discord_twitch_chat.send(streamEmbed);