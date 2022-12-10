
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const fs = require('fs');

module.exports = {
    name: 'cat',
    description: "cat command",
    admin: false,
    type: "test",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed, MessageAttachment } = require('discord.js');

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let cat_embed = new MessageEmbed()
            .setColor('#000000')
            .setImage('attachment://cat03_idle.gif')
            .setFooter({ text: `♡♡♡♡♡` }); // `♡♡♡--`

        const idle = new MessageAttachment(`./assets/cat03_gifs/cat03_idle.gif`);

        let curMsg = await msg.channel.send({ embeds: [cat_embed], files: [idle] });
        let emojiList = ['🇦', '🇧', '🇨', '🇩'];

        for (const emoji of emojiList) await curMsg.react(emoji);
        const reactionCollector = curMsg.createReactionCollector({ filter: (reaction, user) => emojiList.includes(reaction.emoji.name) && user.id != curMsg.author.id, time: 1000 * 30 });

        let animation, new_animation = 'idle';
        reactionCollector.on('collect', (reaction, user) => {
            if (user.id == curMsg.author.id) return;
            if (!emojiList.includes(reaction.emoji.name)) return;
            reaction.users.remove(user);

            switch (reaction.emoji.name) {
                case emojiList[0]:
                    new_animation = 'idle';
                    break;
                case emojiList[1]:
                    new_animation = 'sit';
                    break;
                case emojiList[2]:
                    new_animation = 'run';
                    break;
                case emojiList[3]:
                    new_animation = 'sneak';
                    break;
                default:
            }

            if (animation != new_animation) {
                animation = new_animation;

                let new_attachment = new MessageAttachment(`./assets/cat03_gifs/cat03_${animation}.gif`);

                let cat_new_embed = new MessageEmbed()
                    .setColor('#000000')
                    .setImage(`attachment://cat03_${animation}.gif`)
                    .setFooter({ text: `♡♡♡♡♡` });

                curMsg.edit({ embeds: [cat_new_embed], files: [new_attachment] });
            }
        });

        reactionCollector.on('end', () => {
            if (!curMsg?.deleted) curMsg.reactions.removeAll();
        });
    },
    async normalize_files() {
        try {
            const folders = await fs.promises.readdir('./assets');

            for (const folder of folders) {
                const files = await fs.promises.readdir(`./assets/${folder}`);

                for (const file of files) {
                    let newFile = file.replace('_8fps', '').replace('_12fps', '');

                    await fs.promises.rename(`./assets/${folder}/${file}`, `./assets/${folder}/${newFile}`);
                }
            }
        }
        catch (e) {
            console.log('failure.', e);
        }
    }
}