module.exports = {
    name: 'purge',
    description: "purge your cards",
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let purge_guide = new MessageEmbed()
                .setTitle(`Purge Guide`)
                .setDescription('You can mass quicksell to the market. The number provided purges that star amount.')
                .setColor('#000000')
                .addField('+purge 1', `quicksells all 1 stars in your inventory that aren't protected`, false)
                .addField('+purge 4', `quicksells all 4 stars in your inventory that aren't protected`, false)
                .addField('+purge 1 2 4', `quicksells all 1, 2 and 4 star cards in your inventory that aren't protected`, false)
                .addField('+purge all', `quicksells all cards in your inventory that aren't protected`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [purge_guide] });
            return;
        }

        if (!(await require('../utility/timers').timer(msg, this.name, this.cooldown))) return; // timers manager checks cooldown

        if (args.length > 6) {
            msg.channel.send('Too many inputs.');
            return;
        }

        let query = [];
        if (args.length == 1) {
            if (isNaN(args[0]) && args[0].toLowerCase() == 'all') {
                query = ['★', '★★', '★★★', '★★★★', '★★★★★', '★★★★★★'];
            }
            else {
                let stars = '';
                for (let i = 0; i < +args[0]; i++) {
                    stars += '★';
                }
                query.push(stars);
            }
        }
        else if (args.length > 1 && args.length <= 6) {
            args.forEach(arg => {
                if (!isNaN(arg)) {
                    let stars = '';
                    for (let i = 0; i < +arg; i++) {
                        stars += '★';
                    }
                    query.push(stars);
                }
            });
        }

        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        let characters = (await db.collection('edition_one').where('owner_id', '==', msg.author.id).where('protected', '==', false).where('stars', 'in', query).get())._docs();

        let quicksell_sum = 0;
        characters.forEach(char => {
            let character = char._fieldsProto;
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

            quicksell_sum += reimburse;

            this.return_card(character);
        });

        await require('../utility/credits').refund(msg, quicksell_sum); // credits manager refunds

        msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Purge: ${quicksell_sum} credits returned.`);
    },
    async return_card(character) {
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        const res = await db.doc(`edition_one/${character['rank_text'][character['rank_text'].valueType]}`).update({
            owner_id: '',
        }).catch(err => msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - This product wasn't stored properly. Please contact Sore#1414.`));
    }
}