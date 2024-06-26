
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
let textWrap = 2000;

module.exports = {
    name: 'leaderboard',
    alias: ['cl', 'top', 'dl', 'mid', 'gl', 'bot', 'stats', 'leaderboards'],
    alias_show: ['stats'],
    description: "see your and other's gambling stats",
    category: 'gambling',
    admin: false,
    type: "production",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        try {
            let recipient = msg.mentions.users.keys().next().value;
            args = args.filter(a => !a.includes('<@'));

            if ((msg.content.toLowerCase().startsWith('+lb') || msg.content.toLowerCase().startsWith('+leaderboard')) && (args.length == 0 || args.length >= 2)) {
                this.leaderboard_guide(msg);
                return;
            }

            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            if (msg.content.toLowerCase().startsWith('+stats') && args.length == 0) {
                this.leaderboard_stats(msg, recipient ?? msg.author.id);
                return;
            }

            try {
                if (msg.content.toLowerCase().startsWith('+stats') && args.length == 1 && admin) {
                    let game_name = args[0];
                    let db_user = await require('../utility/queries').user(msg.guildId, msg.author.id);

                    let game_stats = new EmbedBuilder()
                        .setTitle(`Stats: ${game_name}`)
                        .setColor('#000000')
                        .setFooter({ text: `${msg.author.username}` })
                        .setTimestamp();

                    if (!db_user.hasOwnProperty(`times_played_${game_name}`)) {
                        game_stats.addFields({ name: 'No Games', value: 'You have no games with this name.', inline: false });
                    }

                    if (db_user?.[`times_played_${game_name}`] && db_user?.[`times_won_${game_name}`] && db_user?.[`net_winnings_${game_name}`]) {
                        game_stats.addFields({ name: 'Winrate', value: `Has won ${(db_user[`times_won_${game_name}`] / db_user[`times_played_${game_name}`] * 100).toFixed(2)}% of ${db_user[`times_played_${game_name}`]} games.`, inline: false });
                        let net_credits = db_user[`net_winnings_${game_name}`] >= 0 ? `You've earned ${comma_adder.add(Math.trunc(db_user[`net_winnings_${game_name}`]))} credits.` : `You've lost ${comma_adder.add(Math.trunc(db_user[`net_winnings_${game_name}`]))} credits.`;
                        game_stats.addFields({ name: 'Net Credits', value: `${net_credits}`, inline: false });
                    }

                    msg.channel.send({ embeds: [game_stats] });
                    require('../utility/timers').reset_timer(msg, this.name); // release resource
                    return;
                }
            }
            catch (err) {
                require('../utility/embeds').notice_embed(discord_client, msg, 'There was an issue retrieving stats for this game.', '#fe3939');
                return;
            }

            if (msg.content.toLowerCase().startsWith('+cl') || msg.content.toLowerCase().startsWith('+top')) {
                if (!require('../utility/timers').timer(msg, 'Credit Leaderboard', 60)) return; // timers manager checks cooldown
                this.leaderboard_cl(msg);
                return;
            }

            if (msg.content.toLowerCase().startsWith('+dl') || msg.content.toLowerCase().startsWith('+mid')) {
                this.leaderboard_dl(msg);
                return;
            }

            if (msg.content.toLowerCase().startsWith('+gl') || msg.content.toLowerCase().startsWith('+bot')) {
                this.leaderboard_gl(msg);
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
            .addFields({ name: '+stats', value: `Shows your relevant stats.`, inline: false })
            .addFields({ name: '+cl || +top', value: `Credit Leaderboard`, inline: false })
            .addFields({ name: '+dl || +mid', value: `Debt Leaderboard`, inline: false })
            .addFields({ name: '+gl || +bot', value: `Gambling Leaderboard`, inline: false })
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();

        msg.channel.send({ embeds: [leaderboard_guide] });
        return;
    },
    async leaderboard_stats(msg, id) {
        let db_user = await require('../utility/queries').user(msg.guildId, id);
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

        const net_winnings_entries = Object.entries(db_user)
            .filter(([key]) => key.startsWith('net_winnings'))
            .map(([key, value]) => ({ key: key.replace('net_winnings_', ''), value: value }))
            .sort((a, b) => a.key.localeCompare(b.key));

        for (let entry of net_winnings_entries) {
            let stat_name = _.capitalize(entry.key.split('_')[entry.key.split('_').length - 1]);
            let net_credits = +entry.value;
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
    },
    async leaderboard_cl(msg) {
        let warning = await msg.reply('Collecting the net worth of all users. Please wait, it may take a moment.');

        let leaderboard_embed = new EmbedBuilder()
            .setTitle('Credits Leaderboard')
            .setColor('#907aa8')
            .setFooter({ text: `${msg.author.globalName ?? msg.author.username}` })
            .setTimestamp();

        let discord_users_ids = [...(await msg.guild.members.fetch()).keys()];

        let map_users_ids_credits = new Map();
        for (let doc of (await db.collection(`servers/${msg.guildId}/members`).get()).docs) {
            let net_credits = (+doc.data().credits ?? 0);// + +(await require('./credits').get_stocks_value(doc.id));
            map_users_ids_credits.set(doc.id, net_credits);
        }

        let users_credits = [];
        for (let user_id of discord_users_ids) {
            if (map_users_ids_credits.get(user_id)) users_credits.push({ id: user_id, credits: +map_users_ids_credits.get(user_id) })
        }

        users_credits.sort((a, b) => { return b.credits - a.credits });
        users_credits = users_credits.filter(u => u.id != '792157930886660120');
        users_credits = users_credits.slice(0, 10);

        for (let user of users_credits) {
            let discord_user = await msg.guild.members.fetch(user.id);
            leaderboard_embed.addFields({ name: discord_user.user.globalName ?? discord_user.user.username, value: `${comma_adder.add(Math.trunc(user.credits))} credits`, inline: false });
        }

        if (warning.deletable) warning.delete();
        msg.reply({ embeds: [leaderboard_embed] });
    },
    async leaderboard_dl(msg) {
        let leaderboard_embed = new EmbedBuilder()
            .setTitle('Debt Leaderboard')
            .setColor('#260F52')
            .setFooter({ text: `${msg.author.globalName ?? msg.author.username}` })
            .setTimestamp();

        let discord_users_ids = [...(await msg.guild.members.fetch()).keys()];

        let map_users_ids_credits = new Map();
        ((await db.collection(`servers/${msg.guildId}/members`).get()).docs).forEach((doc) => {
            let net_credits = 0;
            for (let [key, value] of Object.entries(doc.data())) {
                if (key.startsWith('net_winnings')) {
                    net_credits += +value;
                }
                if (key == 'deathroll_stats') {
                    for (let stats in value) {
                        net_credits += +value[stats].credit_net;
                    }
                }
            }
            map_users_ids_credits.set(doc.id, net_credits);
        });

        let users_credits = [];
        for (let user_id of discord_users_ids) {
            if (map_users_ids_credits.get(user_id)) users_credits.push({ id: user_id, credits: +map_users_ids_credits.get(user_id) })
        }

        users_credits.sort((a, b) => { return a.credits - b.credits });
        users_credits = users_credits.filter(u => u.credits < 0);
        users_credits = users_credits.slice(0, 10);

        for (let user of users_credits) {
            let discord_user = await msg.guild.members.fetch(user.id);
            leaderboard_embed.addFields({ name: discord_user.user.globalName ?? discord_user.user.username, value: `${comma_adder.add(Math.trunc(user.credits))} credits`, inline: false });
        }

        if (users_credits.length == 0) {
            leaderboard_embed.setDescription('[none]');
        }

        msg.channel.send({ embeds: [leaderboard_embed] });
    },
    async leaderboard_gl(msg) {
        let leaderboard_embed = new EmbedBuilder()
            .setTitle('Gambling Leaderboard')
            .setColor('#80122a')
            .setFooter({ text: `${msg.author.globalName ?? msg.author.username}` })
            .setTimestamp();

        let discord_users_ids = [...(await msg.guild.members.fetch()).keys()];

        let map_users_ids_credits = new Map();
        ((await db.collection(`servers/${msg.guildId}/members`).get()).docs).forEach((doc) => {
            let net_credits = 0;
            for (let [key, value] of Object.entries(doc.data())) {
                if (key.startsWith('net_winnings')) {
                    net_credits += +value;
                }
                if (key == 'deathroll_stats') {
                    for (let stats in value) {
                        net_credits += +value[stats].credit_net;
                    }
                }
            }
            map_users_ids_credits.set(doc.id, net_credits);
        });

        let users_credits = [];
        for (let user_id of discord_users_ids) {
            if (map_users_ids_credits.get(user_id)) users_credits.push({ id: user_id, credits: +map_users_ids_credits.get(user_id) })
        }

        users_credits.sort((a, b) => { return b.credits - a.credits });
        users_credits = users_credits.filter(u => u.credits > 0);
        users_credits = users_credits.slice(0, 10);

        for (let user of users_credits) {
            let discord_user = await msg.guild.members.fetch(user.id);
            leaderboard_embed.addFields({ name: discord_user.user.globalName ?? discord_user.user.username, value: `${comma_adder.add(Math.trunc(user.credits))} credits`, inline: false });
        }

        if (users_credits.length == 0) {
            leaderboard_embed.setDescription('[none]');
        }

        msg.channel.send({ embeds: [leaderboard_embed] });
    }
}