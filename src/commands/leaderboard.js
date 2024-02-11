
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');
const comma_adder = require('commas');
let _ = require('lodash');

const wrapText = require("wrap-text");
let textWrap = 31;

module.exports = {
    name: 'leaderboard',
    alias: ['lb', 'stats', 'leaderboards'],
    alias_show: ['stats'],
    description: "see your and other's gambling stats",
    category: 'gambling',
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        try {
            let recipient = msg.mentions.users.keys().next().value;
            args = args.filter(a => !a.includes('<@'));

            if ((msg.content.toLowerCase().startsWith('+lb') || msg.content.toLowerCase().startsWith('+leaderboard')) && (args.length == 0 || args.length >= 2)) {
                this.leaderboard_guide(msg);
                return;
            }

            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            if (msg.content.toLowerCase().startsWith('+stats') || (args.length == 1 && args[0].toLowerCase() == 'stats')) {
                this.leaderboard_stats(msg, recipient ?? msg.author.id);
                return;
            }

            this.leaderboard_guide(msg);
            return;
        }
        catch (err) {
            msg.channel.send('Something went wrong with this command.');
        }
    },
    async leaderboard_guide(msg) {
        let leaderboard_guide = new EmbedBuilder()
            .setTitle(`Leaderboards`)
            .setDescription(`This command will eventually show all leaderboards.`)
            .setColor('#000000')
            .addFields({ name: '+stats || +lb stats', value: `Shows your relevant stats.`, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [leaderboard_guide] });
        return;
    },
    async leaderboard_stats(msg, id) {
        let db_user = await require('../utility/queries').user(id);
        let user_discord = msg.guild.members.cache.find(user => user.id === id);

        let leaderboard_stats = new EmbedBuilder()
            .setTitle(`${db_user.pref_name ?? user_discord.nickname ?? user_discord.displayName}`)
            .setThumbnail(db_user.pref_image ?? user_discord.displayAvatarURL())
            .setColor(db_user.pref_color ?? user_discord.displayHexColor)
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        if (db_user.pref_status != null && db_user.pref_status != '') {
            leaderboard_stats.setDescription(wrapText(db_user.pref_status, textWrap));
        }

        let stats = false;
        let net_winnings = 0;
        for (let [key, value] of Object.entries(db_user)) {
            let net_credits = 0;
            let stat_name = '';
            if (key.startsWith('net_winnings')) {
                net_credits = +value;
                stat_name = _.capitalize(key.split('_')[key.split('_').length - 1]);
            }
            if (key == 'deathroll_stats') {
                for (let stats in value) {
                    net_credits = +value[stats].credit_net;
                }
                stat_name = 'Deathroll';
            }
            if (net_credits != 0) {
                stats = true;
                net_winnings += net_credits;
                leaderboard_stats.addFields({ name: `${stat_name}`, value: `${comma_adder.add(Math.trunc(net_credits))} credits`, inline: false });
            }
        }

        if (!stats) {
            leaderboard_stats.addFields({ name: `No Stats`, value: `You have clean books.`, inline: false });
        }
        else {
            leaderboard_stats.addFields({ name: `Net Winnings`, value: `${comma_adder.add(Math.trunc(net_winnings))} credits`, inline: false });
        }

        msg.channel.send({ embeds: [leaderboard_stats] });
        return;
    }
}