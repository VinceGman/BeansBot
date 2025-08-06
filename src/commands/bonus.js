const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');

const stimulus_payout = 1200000;
const raise_payout = 2500;

module.exports = {
    name: 'bonus',
    alias: ['stimulus', 'raise'], // you cant add aliases
    description: "claim a bonus once a month",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        const booster = msg.member.roles.cache.some(role => role.name.toLowerCase().includes('booster')) ? 1.25 : 1;

        if (msg.content.toLowerCase().startsWith('+bonus')) {
            await this.bonus_guide(msg, booster);
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        const user = await require('../utility/queries').user(msg.guildId, msg.author.id);
        const bonus = user.hasOwnProperty('bonus') ? user['bonus'] : { lastUsedMonth: -1, lastUsedYear: -1, method: '' };

        const today = new Date();
        if (bonus.lastUsedMonth == today.getMonth() && bonus.lastUsedYear == today.getFullYear()) {
            await this.bonus_unavailable(msg, bonus);
            return;
        }

        bonus.lastUsedMonth = today.getMonth();
        bonus.lastUsedYear = today.getFullYear();

        try {
            if (msg.content.toLowerCase().startsWith('+stim')) {
                bonus.method = 'stimulus';
                await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({ bonus: bonus }, { merge: true });
                await require('../utility/credits').refund(discord_client, msg, msg.author.id, stimulus_payout); // credits manager refunds on error
                await this.stimulus_embed(msg, booster);
                return;
            }
            else if (msg.content.toLowerCase().startsWith('+raise')) {
                bonus.method = 'raise';
                await db.doc(`servers/${msg.guildId}/members/${msg.author.id}`).set({ bonus: bonus }, { merge: true });
                await this.raise_embed(msg, booster);
                return;
            }
        }
        catch (err) {
            require('../utility/embeds').notice_embed(discord_client, msg, 'There was an issue with this request.', '#fe3939');
            return;
        }
    },
    async bonus_guide(msg, booster) {
        let color = '#607d8b';
        let booster_bonus = '';
        if (booster > 1) {
            color = '#f47fff';
            booster_bonus = 'Booster ';
        }

        let embed = new EmbedBuilder()
            .setTitle(`${booster_bonus}Bonus`)
            .setColor(color)
            .setDescription(`Claim a bonus every month. Choose one:`)
            .addFields({ name: '**Boosters**', value: `Earn an extra **25%** on any bonus you choose by boosting this server.`, inline: false })
            .addFields({ name: '**+stimulus**', value: `Earn **${comma_adder.add(Math.trunc(stimulus_payout * booster))}** credits instantly.`, inline: false })
            .addFields({ name: '**+raise**', value: `Increase your hourly **+income** by **${comma_adder.add(Math.trunc(raise_payout * booster))}** credits for the rest of the month.`, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [embed] });
    },
    async bonus_unavailable(msg, bonus) {
        let embed = new EmbedBuilder()
            .setTitle(`Bonus Unavailable`)
            .setColor('#607d8b')
            .setDescription(`You claimed a **${bonus.method}** already this month.`)
            .addFields({ name: 'Bonus Available', value: `Next Month`, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [embed] });
    },
    async stimulus_embed(msg, booster) {
        let color = '#607d8b';
        let booster_stimulus = '';
        if (booster > 1) {
            color = '#f47fff';
            booster_stimulus = 'Booster ';
        }

        let embed = new EmbedBuilder()
            .setTitle(`${booster_stimulus}Stimulus`)
            .setColor(color)
            .addFields({ name: 'Bonus', value: `${comma_adder.add(Math.trunc(stimulus_payout * booster))} credits`, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [embed] });
    },
    async raise_embed(msg, booster) {
        let color = '#607d8b';
        let booster_raise = '';
        if (booster > 1) {
            color = '#f47fff';
            booster_raise = 'Booster ';
        }

        let embed = new EmbedBuilder()
            .setTitle(`${booster_raise}Raise`)
            .setColor(color)
            .addFields({ name: 'Bonus', value: `You received a raise of **${comma_adder.add(Math.trunc(raise_payout * booster))}** credits`, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [embed] });
    }
}