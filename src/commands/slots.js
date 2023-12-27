
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'slots',
    description: "play slots",
    category: 'gambling',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        try {
            if (msg.guild.id != '1126661700867854366') {
                msg.channel.send(`This command only works in Sore's main server.`)
                return;
            }

            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            let emojis = [...(await msg.guild.emojis.fetch())].map(([id, emoji]) => ({ id, emoji }));
            let emoji_count = emojis.length;

            if (emoji_count <= 8) {
                msg.channel.send('There are not enough emojis in this server to run slots.');
                return;
            }

            if (!(await require('../utility/credits').transaction(discord_client, msg, 1000))) return; // credits manager validates transaction

            let slot1 = Math.floor(Math.random() * emoji_count); // [0, 8]
            let slot2 = Math.floor(Math.random() * emoji_count); // [0, 8]
            let slot3 = Math.floor(Math.random() * emoji_count); // [0, 8]

            let slots = [slot1, slot2, slot3];
            let money = 0;

            for (let slot of slots) {
                if (slot == 0) money += 2500;
            }

            if (slot1 == slot2 && slot2 == slot3) money += (3 * 2500);

            require('../utility/credits').refund(discord_client, msg.author.id, money); // credits manager refunds on error

            msg.channel.send(`Slots: |${emojis[slot1].emoji}|${emojis[slot2].emoji}|${emojis[slot3].emoji}| = Winnings: ${money}`);

            // let slots_feedback = new EmbedBuilder()
            //     // .setTitle(`${emojis[slot1].emoji}${emojis[slot2].emoji}${emojis[slot3].emoji}`)
            //     .setDescription(`|${emojis[slot1].emoji}|${emojis[slot2].emoji}|${emojis[slot3].emoji}|`)
            //     .setColor('#000000')
            //     // .addFields({ name: '+example ex', value: `example text`, inline: false })
            //     // .addFields({ name: '+example second ex', value: `example text`, inline: false })
            //     .setFooter({ text: `${msg.author.username}` })
            //     .setTimestamp();

            // msg.channel.send({ embeds: [slots_feedback] });
            // return;
        }
        catch (err) {
            console.log(err);
        }
    }
}