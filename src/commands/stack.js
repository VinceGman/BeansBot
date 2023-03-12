
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'stack',
    alias: ['deck'],
    description: "arrange your stack",
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        if (args.length == 0) {
            let stack_guide = new MessageEmbed()
                .setTitle(`Stack Guide`)
                .setDescription(`This is where you arrange your stack. The cards fight and resolve from left to right.`)
                .setColor('#000000')
                .addField('+stack 1 45 2067 54 203 1444', `Assign your stack by card ID's.`, false)
                .addField('+stack show', `Shows your current stack.`, false)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [stack_guide] });
            return;
        }
        else if (args.length == 1 && args[0] == 'show') {
            this.stack_show(discord_client, msg);
            return;
        }

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        if (args.length != 6) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - You must have 6 cards as ID's, See -> **+stack**`);
            return;
        }

        let team = [];
        for (let id of args) {
            try {
                var character = (await db.collection(`edition_one`).where('owner_id', '==', msg.author.id).where('rank_text', '==', id.toString()).limit(1).get())._docs()[0];
                team.push({ name: character._fieldsProto.name.stringValue, attack: +character._fieldsProto.attack.integerValue, health: +character._fieldsProto.health.integerValue, type: +character._fieldsProto.type.integerValue });
            }
            catch (err) {
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - You do not own character ${id}.`);
                return;
            }
        }

        await this.stack_save(team, 1, msg);
        await this.stack_show(discord_client, msg);
        return;
    },
    async stack_show(discord_client, msg) {
        let user = discord_client.users.cache.find(user => user.id === msg.author.id);
        let db_user = await require('../utility/queries').user(msg.author.id);
        
        let team = db_user?.[`stack_${1}`] ?? {};
        for (let i = 0; i < team.length; i++) {
            team[i] = { name: team[i].name, attack: team[i].attack, health: team[i].health, type: team[i].type };
        }

        let stack_show = new MessageEmbed()
            .setTitle(`Stack`)
            .setThumbnail(db_user.pref_image ?? user.avatarURL())
            .setColor(db_user.pref_color ?? `#ADD8E6`)
            .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
            .setTimestamp();

        for (let i = 0; i < team.length; i++) {
            stack_show.addField(`${team[i].name}`, `A${team[i].attack} H${team[i].health} T${team[i].type}`, false)
        }

        msg.channel.send({ embeds: [stack_show] });
        return;
    },
    async stack_save(team, num, msg) {
        const res = await db.doc(`members/${msg.author.id}`).update({
            [`stack_${num}`]: team,
        }).catch(err => msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - This product wasn't stored properly. Please contact Sore#1414.`));
    }
}