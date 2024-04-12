// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
}); // firestore credentials

const comma_adder = require('commas');
const { EmbedBuilder } = require('discord.js');
const { sha256 } = require('../utility/hash')

let vault_codes = [];

module.exports = {
    name: 'vault',
    alias: ['code', 'v'],
    description: "claim a vault code",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 1,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        if (vault_codes.length == 0) await this.create_codes(200);

        if (args.length == 0) {
            let pages = [];
            let page_num = 1;
            let codes_list = '';
            for (let i = 0; i < vault_codes.length; i++) {
                codes_list += !vault_codes[i].hasOwnProperty('claimed') ? `=> ${vault_codes[i].code}\n` : `=> ${vault_codes[i].code} => **${vault_codes[i].claimed}**\n`;

                if (codes_list.length > 900 || ((i + 1) % 20 == 0)) {
                    let hash_guide = new EmbedBuilder()
                        .setTitle(`Vault Guide`)
                        .setDescription(`Everything you type will generate a unique hash. You're paid if you match a vault code. Each vault code pays 50,000 credits.`)
                        .setColor('#37914f')
                        .addFields({ name: '+vault <input>', value: `You're paid for vault codes that match the hashed input.`, inline: false })
                        .addFields({ name: `Codes - ${page_num}`, value: `${codes_list}`, inline: false })
                        .setFooter({ text: `${msg.author.username}` })
                        .setTimestamp();

                    pages.push(hash_guide);
                    page_num++;
                    codes_list = '';
                }
            }

            await require('../utility/pagination').paginationEmbed(msg, pages);
            require('../utility/timers').reset_timer(msg, this.name); // release resource
            return;
        }

        try {
            let salt = (new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });

            let hash = (await sha256(`${salt}${msg.author.id}${args.join(' ')}`)).slice(-3);

            let hash_output = new EmbedBuilder()
                .setTitle(`Vault`)
                .addFields({ name: 'Hash', value: `Code: ${hash}`, inline: false })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            let code = vault_codes.find(code => code.code == hash && !code.hasOwnProperty('claimed'));
            if (code) {
                code.claimed = msg.author.username;

                let db_user = await require('../utility/queries').user(msg.author.id);
                let vault_total = db_user?.vault_total ? +db_user.vault_total : 0;

                vault_total += +code.reward;

                await db.doc(`members/${msg.author.id}`).set({
                    vault_total: vault_total.toString(),
                }, { merge: true });

                await require('../utility/credits').refund(discord_client, msg.author.id, +code.reward); // credits manager refunds credits

                hash_output.setColor('#37914f')
                    .addFields({ name: 'Reward', value: `+${comma_adder.add(code.reward)}`, inline: false });
            }
            else {
                hash_output.setColor('#fe3939')
                    .addFields({ name: 'Claim', value: `Failed - ${vault_codes.find(code => code.code == hash && code.hasOwnProperty('claimed')) ? 'Taken' : 'None'}`, inline: false });
            }

            msg.channel.send({ embeds: [hash_output] });
            require('../utility/timers').reset_timer(msg, this.name); // release resource
            return;
        }
        catch (err) {
            console.log(err);
            let hash_output = new EmbedBuilder()
                .setTitle(`Error`)
                .setDescription(`Your vault code claim failed.`)
                .setColor('#fe3939')
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [hash_output] });
            return;
        }
    },
    async create_codes(count, reward = '50000') {
        let seed = Math.floor(Date.now() / 1000);
        for (let i = 1; i <= count; i++) {
            vault_codes.push({
                reward: reward.toString(), code: (await sha256(`${seed}${i}`)).slice(-3)
            })
        }
    }
}