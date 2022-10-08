module.exports = {
    name: 'top',
    description: "see top cards owned",
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        }); // firestore credentials

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        if (args.length == 1 && !isNaN(args[0]) && args[0] >= 1) {
            var page = +args[0];
        }
        else {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - +top (page num) -> +top 1`);
            return;
        }

        let ownedText = '';
        try {
            var character_ref = (await db.collection('edition_one').where('rank', '>=', ((page - 1) * 25) + 1).orderBy("rank", "asc").limit(25).get())._docs(); // retrieve characters from database
            character_ref.forEach(character => {
                if (ownedText.length >= 850) return;

                character = character._fieldsProto;

                let user = discord_client.users.cache.find(user => user.id === character['owner_id'][character['owner_id'].valueType]);
                user = user ? `**${user.username}#${user.discriminator}**` : '[none]';

                let sale = character['for_sale'][character['for_sale'].valueType] ? ` - ✅ ${character['selling_price'][character['selling_price'].valueType]}` : '';

                ownedText += `${character['name'][character['name'].valueType]}${sale} - #${character['rank'][character['rank'].valueType]} => ${user}\n`;
            });
            ownedText = ownedText == '' ? '[none]' : ownedText;
        }
        catch (err) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - System Error: Anime API Failed`);
            return;
        }

        const { MessageEmbed } = require('discord.js');

        let top_embed = new MessageEmbed()
            .setTitle(`Top List - Page: ${page}`)
            .setDescription(ownedText)
            .setColor(`#fc5d65`)
            .setFooter({ text: `BHP Top List` })
            .setTimestamp();

        msg.channel.send({ embeds: [top_embed] });
    }
}