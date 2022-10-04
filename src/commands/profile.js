module.exports = {
    name: 'profile',
    description: "shows your money and collectibles",
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        const { MessageEmbed } = require('discord.js');

        const wrapText = require("wrap-text");
        let textWrap = 31;

        if (!(await require('../utility/timers').timer(msg, this.name, this.cooldown))) return; // timers manager checks cooldown

        let credits = +(await require('../utility/queries').user(msg.author.id)).credits;
        let owned = (await db.collection('edition_one').where('owner_id', '==', msg.author.id).orderBy("rank", "asc").get())._docs();

        let ownedText = '';
        let i = 0;
        while (ownedText.length <= 920 && i < owned.length) {
            let lock = owned[i]._fieldsProto['protected'][owned[i]._fieldsProto['protected'].valueType] ? ' - 🔒' : '';
            let sale = owned[i]._fieldsProto['for_sale'][owned[i]._fieldsProto['for_sale'].valueType] ? ' - ✅' : '';
            
            ownedText += `${owned[i]._fieldsProto['name'][owned[i]._fieldsProto['name'].valueType]}${lock}${sale} - #${owned[i]._fieldsProto['rank'][owned[i]._fieldsProto['rank'].valueType]} - ${owned[i]._fieldsProto['stars'][owned[i]._fieldsProto['stars'].valueType]}\n`;
            i++;
        }

        ownedText = ownedText == '' ? '[none]' : ownedText;

        let profile_embed = new MessageEmbed()
            .setTitle(`${wrapText(msg.author.username, textWrap)}`)
            .addField('Currency', `${credits} credits`, false)
            .addField('Cards Owned', `${ownedText}`, false)
            .setThumbnail(msg.author.avatarURL())
            .setColor(`#ADD8E6`)
            .setFooter({ text: wrapText(`BHP Profile`, textWrap) })
            .setTimestamp();

        msg.channel.send({ embeds: [profile_embed] });
    }
}