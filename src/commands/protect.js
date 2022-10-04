
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'protect',
    description: "protect a card",
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        const { MessageEmbed } = require('discord.js');

        if (args.length == 0) {
            let protect_guide = new MessageEmbed()
                .setTitle(`Protect Guide`)
                .setDescription(`Protected cards aren't affected by **+purge**.`)
                .setColor('#000000')
                .addField('+protect 123', `protects card with rank #123`, false) 
                .addField('+protect Nezuko Kamado', `protects card with name 'Nezuko Kamado'`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [protect_guide] });
            return;
        }

        if (!(await require('../utility/timers').timer(msg, this.name, this.cooldown))) return; // timers manager checks cooldown
        let character = await require('../utility/queries').owned_character(msg, args);
        if (!character) return;

        const res = await db.doc(`edition_one/${character['rank_text'][character['rank_text'].valueType]}`).update({
            protected: !character['protected'][character['protected'].valueType],
        }).catch(err => msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - This product wasn't stored properly. Please contact Sore#1414.`));

        msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Protection on ${character['name'][character['name'].valueType]} set to ${!character['protected'][character['protected'].valueType]}.`);
    }
}