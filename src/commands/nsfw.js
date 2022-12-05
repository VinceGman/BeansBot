const gen = require("images-generator");
const { MessageEmbed, Message } = require('discord.js');


module.exports = {
    name: 'nsfw',
    alias: ['sex', 'dirty'],
    options: ['a'],
    description: "access nsfw chat and content",
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown
        let options = require('../utility/parsers').parse_command(msg, this.name, this.alias);

        if (msg.channel.id != process.env.nsfw_channel_id && !msg.channel.nsfw) {
            if (args.length == 0 || args.length >= 2) {
                this.guide(msg, false);
            }
            else if (args.length == 1) {
                if (args[0].toLowerCase() == 'join') {
                    let user = await msg.guild.members.fetch(msg.author.id);
                    let role = msg.guild.roles.cache.find(role => role.name.toLowerCase() === 'nsfw');
                    user.roles.add(role);
                    let notice = await msg.channel.send('NSFW role given.');
                    if (!msg?.deleted) msg.delete();
                    await new Promise(resolve => setTimeout(resolve, 12000));
                    if (!notice?.deleted) notice.delete();
                }
                else if (args[0].toLowerCase() == 'leave') {
                    let user = await msg.guild.members.fetch(msg.author.id);
                    let role = msg.guild.roles.cache.find(role => role.name.toLowerCase() === 'nsfw');
                    user.roles.remove(role);
                    let notice = await msg.channel.send('NSFW role taken.');
                    if (!msg?.deleted) msg.delete();
                    await new Promise(resolve => setTimeout(resolve, 12000));
                    if (!notice?.deleted) notice.delete();
                }
            }
            return;
        }

        if (args.length == 0 || args.length >= 2) {
            this.guide(msg, true);
        }
        else if (args.length == 1) {
            let input;
            let type = 'real';
            switch (args[0].toLowerCase()) {
                case 'other':
                    this.guide(msg, true);
                    break;
                case 'anal':
                    input = 'anal';
                    break;
                case '4k':
                    input = 'fourk';
                    break;
                case 'gif':
                    input = 'pornGif';
                    break;
                case 'pussy':
                    input = 'pussy';
                    break;
                case 'hentai':
                    input = 'hentai';
                    type = 'anime';
                    break;
                case 'lesbian':
                    input = 'lesbian';
                    type = 'anime';
                    break;
                case 'boobs':
                    input = 'boobs';
                    if (options.includes('a')) {
                        type = 'anime';
                    }
                    break;
                case 'ass':
                    input = 'ass';
                    if (options.includes('a')) {
                        type = 'anime';
                    }
                    break;
                case 'thighs':
                    input = 'thighs';
                    if (options.includes('a')) {
                        type = 'anime';
                    }
                    break;
                default:
                    if (!msg?.deleted) msg.delete();
                    let notice = await msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - For Commands, See: **+nsfw**`);
                    await new Promise(resolve => setTimeout(resolve, 30000));
                    if (!notice?.deleted) notice.delete();
                    return;
            }

            try {
                var img = await gen.nsfw[type][input]();
            }
            catch (err) {
                if (!msg?.deleted) msg.delete();
                let notice = await msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - System Error: NSFW API Failed`);
                await new Promise(resolve => setTimeout(resolve, 30000));
                if (!notice?.deleted) notice.delete();
                return;
            }

            let db_user = await require('../utility/queries').user(msg.author.id);

            console.log(type, input, img);

            let nsfw_content = new MessageEmbed()
                .setColor(db_user.pref_color ?? '#FFFFFF')
                .setImage(img)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator} - /${type}/${input}` })
                .setTimestamp();

            let curMsg = await msg.channel.send({ embeds: [nsfw_content] });
            if (!msg?.deleted) msg.delete();


            let emoji = '⭐';
            await curMsg.react(emoji);
            const reactionCollector = curMsg.createReactionCollector({ filter: (reaction, user) => reaction.emoji.name == emoji && user.id != curMsg.author.id, time: 1000 * 30 });

            let starred = false;
            reactionCollector.on('collect', async (reaction, user) => {
                if (user.id == curMsg.author.id) return;
                if (reaction.emoji.name != emoji) return;

                reaction.users.remove(user);
                reaction.users.remove(curMsg.author);

                let db_starred_user = await require('../utility/queries').user(msg.author.id);

                if (!starred) {
                    starred = true;
                    let nsfw_content = new MessageEmbed()
                        .setColor(db_starred_user.pref_color ?? '#000000')
                        .setImage(img)
                        .setFooter({ text: `${user.username}#${user.discriminator} - /${type}/${input} - ⭐` })
                        .setTimestamp();
                    curMsg.edit({ embeds: [nsfw_content] });
                }
            });

            reactionCollector.on('end', () => {
                if (!curMsg?.deleted && !starred) curMsg.delete();
            });
        }
        return;
    },
    async guide(msg, full) {
        let nsfw_guide = new MessageEmbed()
            .setTitle(`NSFW Guide`)
            .setDescription(`**join/leave** work only in #commands. All **other** commands work only in #nsfw.`)
            .setColor('#000000')
            .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
            .setTimestamp();

        if (!full) {
            nsfw_guide
                .addField('+nsfw join', `Join NSFW.`, true)
                .addField('+nsfw leave', `Leave NSFW.`, true);
        }
        else if (full) {
            nsfw_guide
                .addField('+nsfw gif', `**real** content: **gif** | **pussy** | **anal** | **4k**`, false)
                .addField('+nsfw hentai', '**anime** content: **hentai** | **lesbian**')
                .addField('+nsfw thighs | +nsfwa thighs', `**real** or **anime** content: **boobs** | **ass** | **thighs**`, false)
                .addField('Reacting ⭐ saves the post to the chat.', 'It will save it under your name with your profile color.')
        }

        if (!msg?.deleted) msg.delete();
        let embed = await msg.channel.send({ embeds: [nsfw_guide] });
        await new Promise(resolve => setTimeout(resolve, 30000));
        if (!embed?.deleted) embed.delete();
    }
}