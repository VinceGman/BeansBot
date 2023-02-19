
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'valorant',
    alias: ['val'],
    description: "valorant stats",
    category: 'information',
    scopes: ['global'],
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let valorant_guide = new MessageEmbed()
                .setTitle(`Valorant Guide`)
                .setDescription(`Get Valorant stats for a user.`)
                .setColor('#000000')
                .addField('+valorant ex', `valorant text`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [valorant_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let valorant_embed = new MessageEmbed()
            .setTitle(`Valorant Stats : Competitive`)
            .setDescription(`Source -> Tracker.gg`)
            .setColor('#d22a36')
            .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
            .setTimestamp();

        try {
            const axios = require('axios');
            const urlencode = require('urlencode');
            const { Tokenizer } = require('html-tokenizer');

            const response = await axios.get(`https://tracker.gg/valorant/profile/riot/${urlencode(args.join(''))}/overview`);
            const tokens = [...Tokenizer.tokenize(response.data)].filter(t => t?.text?.includes('window.__INITIAL_STATE__ = '));

            for (let season of JSON.parse(tokens[0].text.replace('window.__INITIAL_STATE__ = ', '')).stats.standardProfiles[0].segments.filter(seg => seg.type == 'season' && seg.attributes.playlist == 'competitive')) {
                valorant_embed.setThumbnail(season.stats.rank.metadata.iconUrl)
                    .addField(`Player Rating`, `${season.stats.trnPerformanceScore.displayValue}`, false)
                    .addField(`Ranked`, `${season.stats.rank.metadata.tierName}         `, true)
                    .addField(`Peak Rank`, `${season.stats.peakRank.metadata.actName} => ${season.stats.peakRank.displayValue}`, true)
                    .addField(`Matches: ${season.stats.matchesPlayed.displayValue} | Time: ${season.stats.timePlayed.displayValue}`, `W/L: ${season.stats.matchesWon.displayValue}/${season.stats.matchesLost.displayValue} | Winrate: ${season.stats.matchesWinPct.displayValue}`, false)
                    .addField(`Rounds: ${season.stats.roundsPlayed.displayValue}`, `W/L: ${season.stats.roundsWon.displayValue}/${season.stats.roundsLost.displayValue} | Winrate: ${season.stats.roundsWinPct.displayValue}`, false)
                    .addField(`Score`, `${season.stats.scorePerMatch.displayValue}/Match | ${season.stats.scorePerRound.displayValue}/Round`, false)
                    // .addField(`KD & KDA`, `${}`, false)
                //     agent.stats.kills.displayValue,
                //     agent.stats.killsPerMatch.displayValue,
                //     agent.stats.deaths.displayValue,
                //     agent.stats.deathsPerMatch.displayValue,
                //     agent.stats.assists.displayValue,
                //     agent.stats.assistsPerMatch.displayValue,
                //     agent.stats.kDRatio.displayValue,
                //     agent.stats.kDARatio.displayValue,
                console.log(season.stats.peakRank);
            }
            // for (let weapon of JSON.parse(tokens[0].text.replace('window.__INITIAL_STATE__ = ', '')).stats.standardProfiles[0].segments.filter(seg => seg.type == 'weapon')) {
            //     console.log(`Name: ${weapon.metadata.name}\n`);
            // }
            // for (let map of JSON.parse(tokens[0].text.replace('window.__INITIAL_STATE__ = ', '')).stats.standardProfiles[0].segments.filter(seg => seg.type == 'map')) {
            //     console.log(`Name: ${map.metadata.name}\n`);
            // }
            // for (let agent of JSON.parse(tokens[0].text.replace('window.__INITIAL_STATE__ = ', '')).stats.standardProfiles[0].segments.filter(seg => seg.type == 'agent')) {
            //     console.log(`Name: ${agent.metadata.name}\n`);
            // }
        }
        catch (err) {
            if (err?.request?.res?.statusCode == 451) {
                msg.channel.send('Set this account to public on Tracker.gg to view.')
                return
            }
            else {
                msg.channel.send('This user could not be found on Tracker.gg.')
                return
            }
        }

        msg.channel.send({ embeds: [valorant_embed] });
        return;
    }
}

//     agent.stats.matchesPlayed.displayValue,
//     agent.stats.matchesWon.displayValue,
//     agent.stats.matchesLost.displayValue,
//     agent.stats.matchesTied.displayValue,
//     agent.stats.matchesWinPct.displayValue,
//     agent.stats.timePlayed.displayValue,
//     agent.stats.roundsPlayed.displayValue,
//     agent.stats.roundsWon.displayValue,
//     agent.stats.roundsLost.displayValue,
//     agent.stats.roundsWinPct.displayValue,
//     agent.stats.scorePerMatch.displayValue,
//     agent.stats.scorePerRound.displayValue,
//     agent.stats.kills.displayValue,
//     agent.stats.killsPerMatch.displayValue,
//     agent.stats.deaths.displayValue,
//     agent.stats.deathsPerMatch.displayValue,
//     agent.stats.assists.displayValue,
//     agent.stats.assistsPerMatch.displayValue,
//     agent.stats.kDRatio.displayValue,
//     agent.stats.kDARatio.displayValue,
//     agent.stats.damageDeltaPerRound.displayValue,
//     agent.stats.damagePerRound.displayValue,
//     agent.stats.damagePerMatch.displayValue,
//     agent.stats.headshots.displayValue,
//     agent.stats.headshotsPercentage.displayValue,
//     agent.stats.dealtHeadshots.displayValue,
//     agent.stats.dealtBodyshots.displayValue,
//     agent.stats.dealtLegshots.displayValue,
//     agent.stats.receivedHeadshots.displayValue,
//     agent.stats.receivedBodyshots.displayValue,
//     agent.stats.receivedLegshots.displayValue,
//     agent.stats.econRatingPerMatch.displayValue,
//     agent.stats.suicides.displayValue,
//     agent.stats.firstBloods.displayValue,
//     agent.stats.firstBloodsPerMatch.displayValue,
//     agent.stats.firstDeaths.displayValue,
//     agent.stats.kAST.displayValue,
//     agent.stats.mostKillsInMatch.displayValue,
//     agent.stats.aces.displayValue,
//     agent.stats.clutches.displayValue,
//     agent.stats.clutchesPercentage.displayValue,
//     agent.stats.clutchesLost.displayValue,
//     agent.stats.clutches1v1.displayValue,
//     agent.stats.clutches1v2.displayValue,
//     agent.stats.clutches1v3.displayValue,
//     agent.stats.clutches1v4.displayValue,
//     agent.stats.clutches1v5.displayValue,
//     agent.stats.clutchesLost1v1.displayValue,
//     agent.stats.clutchesLost1v2.displayValue,
//     agent.stats.clutchesLost1v3.displayValue,
//     agent.stats.clutchesLost1v4.displayValue,
//     agent.stats.clutchesLost1v5.displayValue,
//     agent.stats.kills1K.displayValue,
//     agent.stats.kills2K.displayValue,
//     agent.stats.kills3K.displayValue,
//     agent.stats.kills4K.displayValue,
//     agent.stats.kills5K.displayValue,
//     agent.stats.kills6K.displayValue,
//     agent.stats.plants.displayValue,
//     agent.stats.plantsPerMatch.displayValue,
//     agent.stats.attackKills.displayValue,
//     agent.stats.attackDeaths.displayValue,
//     agent.stats.attackKDRatio.displayValue,
//     agent.stats.attackAssists.displayValue,
//     agent.stats.attackRoundsWon.displayValue,
//     agent.stats.attackRoundsLost.displayValue,
//     agent.stats.attackRoundsPlayed.displayValue,
//     agent.stats.attackRoundsWinPct.displayValue,
//     agent.stats.attackScore.displayValue,
//     agent.stats.attackScorePerRound.displayValue,
//     agent.stats.attackDamagePerRound.displayValue,
//     agent.stats.attackHeadshots.displayValue,
//     agent.stats.attackFirstBloods.displayValue,
//     agent.stats.attackFirstDeaths.displayValue,
//     agent.stats.attackKAST.displayValue,
//     agent.stats.defuses.displayValue,
//     agent.stats.defusesPerMatch.displayValue,
//     agent.stats.defenseKills.displayValue,
//     agent.stats.defenseDeaths.displayValue,
//     agent.stats.defenseKDRatio.displayValue,
//     agent.stats.defenseAssists.displayValue,
//     agent.stats.defenseRoundsWon.displayValue,
//     agent.stats.defenseRoundsLost.displayValue,
//     agent.stats.defenseRoundsPlayed.displayValue,
//     agent.stats.defenseRoundsWinPct.displayValue,
//     agent.stats.defenseScore.displayValue,
//     agent.stats.defenseScorePerRound.displayValue,
//     agent.stats.defenseDamagePerRound.displayValue,
//     agent.stats.defenseHeadshots.displayValue,
//     agent.stats.defenseFirstBloods.displayValue,
//     agent.stats.defenseFirstDeaths.displayValue,
//     agent.stats.defenseKAST.displayValue

// type
// attributes
// metadata
// expiryDate
// stats

// rank
// trnPerformanceScore
// peakRank