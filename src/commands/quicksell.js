module.exports = {
    name: 'quicksell',
    alias: ['qs'],
    description: "sell your cards back to the market",
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let quicksell_guide = new MessageEmbed()
                .setTitle(`Quicksell Guide`)
                .setDescription(`+quicksell (name) -> +quicksell Levi\nor\n+quicksell (id) -> +quicksell 2`)
                .setColor('#000000')
                .addField('Common', `250`, false)
                .addField('Uncommon', `500`, false)
                .addField('Rare', `2500`, false)
                .addField('Epic', `5000`, false)
                .addField('Legendary', `15000`, false)
                .addField('Ultimate', `25000`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [quicksell_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let attribute, match;
        if (args.length == 1 && !isNaN(args[0].replace('#', ''))) {
            attribute = 'rank_text';
            match = args[0].replace('#', '');
        }
        else {
            attribute = 'name_lower';
            match = require('../utility/searches').search('name', args.join(' ').toLowerCase())[0];
        }

        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        try {
            var character_ref = (await db.collection(`edition_one`).where('owner_id', '==', msg.author.id).where(attribute, '==', match.toLowerCase()).limit(1).get())._docs()[0];
            var character = character_ref._fieldsProto;
            if (character == null) throw 'null character';
        }
        catch (err) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - No character found.`);
            return;
        }

        let reimburse = 0;
        switch (character['rarity'][character['rarity'].valueType]) {
            case 'Common':
                reimburse = 250;
                break;
            case 'Uncommon':
                reimburse = 500;
                break;
            case 'Rare':
                reimburse = 2500;
                break;
            case 'Epic':
                reimburse = 5000;
                break;
            case 'Legendary':
                reimburse = 15000;
                break;
            case 'Ultimate':
                reimburse = 25000;
                break;
            default:
                reimburse = 0;
        }

        await require('../commands/purge').return_card(character, msg);
        await require('../utility/credits').refund(msg.author.id, reimburse); // credits manager refunds

        msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Reimbursed: ${reimburse}`);
    }
}