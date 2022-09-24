const { MessageEmbed } = require('discord.js');
const wrapText = require("wrap-text");
let textWrap = 31;
let timer = {};
let cooldown = 6;

// https://console.cloud.google.com/apis/dashboard?project=beans-326017&show=all
// https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'purge',
    description: "purge your cards",
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        if (args.length == 0) {
            let purge_guide = new MessageEmbed()
                .setTitle(`Purge Guide`)
                .setDescription('You can mass quicksell to the market. The number provided purges that star amount.')
                .setColor('#000000')
                .addField('+purge 1', `quicksells all 1 stars in your inventory that aren't protected`, false)
                .addField('+purge 4', `quicksells all 4 stars in your inventory that aren't protected`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [purge_guide] });
            return;
        }

        let current_time = Math.floor(Date.now() / 1000);
        if (timer.hasOwnProperty(msg.author.id.toString())) {
            if (current_time < timer[msg.author.id.toString()] + cooldown) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Purge Cooldown: <t:${timer[msg.author.id.toString()] + cooldown}:R>`);
                return;
            }
        }
        timer[msg.author.id.toString()] = current_time;

        let stars = '';
        for (let i = 0; i < +args[0]; i++) {
            stars += '★';
        }

        let user = (await db.doc(`members/${msg.author.id}`).get())._fieldsProto;
        let pulls = (await db.collection('cards').where('owner_id', '==', msg.author.id).where('stars', '==', stars).where('protected', '==', false).get())._docs();
        let amount;
        if (user != null) {
            amount = +user.credits.stringValue;
        }
        else {
            amount = 12000;
        }

        let quicksell_sum = 0;
        pulls.forEach(p => {
            let reimburse = 0;
            switch (p._fieldsProto.rarity.stringValue) {
                case 'Common':
                    reimburse = 400;
                    break;
                case 'Uncommon':
                    reimburse = 800;
                    break;
                case 'Rare':
                    reimburse = 3600;
                    break;
                case 'Epic':
                    reimburse = 7200;
                    break;
                case 'Legendary':
                    reimburse = 14400;
                    break;
                case 'Ultimate':
                    reimburse = 28800;
                    break;
                default:
            }
            
            quicksell_sum += reimburse;

            this.remove(p);
        });

        amount += quicksell_sum;

        await db.doc(`members/${msg.author.id}`).set({
            credits: amount.toString(),
        }, { merge: true });
        console.log(quicksell_sum, amount);
        msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Purge: ${quicksell_sum} credits returned.`);
    },
    async remove(p) {
        console.log('deleting', p._fieldsProto.name.stringValue);
        let res = await db.collection('cards').doc(`${p._ref._path.segments[1]}`).delete();
    }
}