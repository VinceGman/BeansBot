// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

module.exports = {
    name: 'withdraw',
    alias: ['wd'],
    description: "withdraw from a joint account",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        try {
            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            let { recipient, parsed_args } = await require('../utility/parsers').parse_user(msg, args, true);
            args = parsed_args;

            let db_user = await require('../utility/queries').user(msg.guildId, recipient);
            let joint = db_user?.joint ? db_user.joint : { credits: '0', users: [] };

            if (!joint.users.includes(msg.author.id) && recipient != msg.author.id) {
                await require('../utility/embeds').notice_embed(discord_client, msg, "You don't have joint access to this account. See -> **+joint**", '#ebcf34');
                return;
            }

            let credits = +joint.credits;

            let amount = 1000;
            let random = false;
            let modifier = 1;

            if (args[0].toLowerCase().startsWith('r')) {
                args[0] = args[0].slice(1, args[0].length);
                random = true;
            }

            if (!isNaN(args[0])) {
                if (+args[0] < 1000) {
                    msg.channel.send(`${msg.author.username} - Your amount must be greater than 1000.`);
                    return;
                }
                if (args[0].includes('.')) {
                    msg.channel.send(`${msg.author.username} - Your number must be whole.`);
                    return;
                }
                amount = +args[0];
            }
            else if (['all', 'half', 'third', 'fourth'].includes(args[0].toLowerCase())) {
                switch (args[0].toLowerCase()) {
                    case 'all':
                        modifier = 1;
                        break;
                    case 'half':
                        modifier = (1 / 2);
                        break;
                    case 'third':
                        modifier = (1 / 3);
                        break;
                    case 'fourth':
                        modifier = (1 / 4);
                        break;
                }
                amount = credits;
            }

            if (modifier != 1) amount = Math.floor(amount * modifier);
            if (random) amount = Math.floor(Math.random() * amount) + 1;

            if (credits < amount) {
                await require('../utility/embeds').notice_embed(discord_client, msg, "Insufficient Funds.", '#fe3939');
                return false;
            }

            credits -= amount;

            await require('../utility/credits').refund(discord_client, msg, msg.author.id, amount); // credits manager refunds credits

            await db.doc(`servers/${msg.guildId}/members/${recipient}`).set({
                joint: { credits: credits.toFixed(2).toString(), users: joint.users },
            }, { merge: true });

            let withdraw_result = new EmbedBuilder()
                .setTitle(`Withdraw Details`)
                .setColor('#37914f')
                // .setDescription(`Paid: ${+args[0]}`)
                // .addFields({ name: 'From', value: `${msg.author.username}`, inline: true })
                .addFields({ name: `Checking`, value: `${(await msg.guild.members.fetch(msg.author.id)).user.username}`, inline: true })
                .addFields({ name: `Amount`, value: `+${comma_adder.add(Math.trunc(amount))} credits`, inline: true })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();
            msg.channel.send({ embeds: [withdraw_result] });
            return;
        }
        catch (err) {
            console.log(err);
        }
    }
}