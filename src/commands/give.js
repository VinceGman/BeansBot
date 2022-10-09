module.exports = {
    name: 'give',
    alias: ['gift'],
    description: "give someone a card",
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let give_guide = new MessageEmbed()
                .setTitle(`Give Guide`)
                .setDescription(`You can (forcefully) give someone a card. You must mention the user you'd like to gift anywhere in the message.`)
                .setColor('#000000')
                .addField('+give Eren Yeager @Sore', `gives the card with name 'Eren Yeager' to Sore.`, false)
                .addField('+give @Sore Eren Yeager', `gives the card with name 'Eren Yeager' to Sore.`, false)
                .addField('+give @Sore 47', `gives the card with rank #47 to Sore.`, false)
                .addField('+give 47 @Sore', `gives the card with rank #47 to Sore.`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [give_guide] });
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        if (msg.mentions.users.size != 1) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - **+give** for more info.`);
            return;
        }

        let recipient = msg.mentions.users.keys().next().value;
        if (recipient == msg.author.id) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - All you do is take and take... **+give** for more info.`);
            return;
        }

        args = args.filter(a => !a.includes('<@'));

        let attribute, match;
        if (args.length == 1 && !isNaN(args[0].replace('#', ''))) {
            attribute = 'rank_text';
            match = args[0].replace('#', '');
        }
        else {
            attribute = 'name_lower';
            match = require('../utility/searches').search('name', args.join(' ').toLowerCase());
        }

        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        try {
            var character_ref = (await db.collection(`edition_one`).where('owner_id', '==', msg.author.id).where(attribute, '==', match).limit(1).get())._docs()[0];
            var character = character_ref._fieldsProto;
            if (character == null) throw 'null character';
        }
        catch (err) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - No character found.`);
            return;
        }

        const res = await db.collection('edition_one').doc(`${character_ref._ref._path.segments[1]}`).update({ // updates owner_id on character_ref card in database
            owner_id: recipient,
        }).catch(err => msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - This product wasn't stored properly. Please contact Sore#1414.`));

        msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Card Given.`);
    }
}