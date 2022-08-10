const { MessageEmbed } = require('discord.js');

// https://console.cloud.google.com/apis/dashboard?project=beans-326017&show=all
// https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'ban_list',
    description: "confessions ban_list manager",
    admin: true,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        let ban_list = await this.getBanList();

        if (args.length > 1 || args.length < 1) {
            this.printBanList(discord_client, msg, ban_list, `+ban_list <id>`);
            return;
        }

        let user = (await discord_client.guilds.cache.get(process.env.server_id).members.fetch()).find(u => u.user.id == args[0]);

        if (!user) {
            msg.channel.send("This is not a user in the server.");
            return;
        }

        if (ban_list.includes(user.user.id)) {
            await db.doc('lists/ban_list').update({
                members: FieldValue.arrayRemove(user.user.id)
            });
            ban_list = ban_list.filter(value => value != user.user.id);
            this.printBanList(discord_client, msg, ban_list, `Removed user from ban_list -> ${user.user.username}#${user.user.discriminator}`);
        }
        else {
            await db.doc('lists/ban_list').update({
                members: FieldValue.arrayUnion(user.user.id)
            });
            ban_list.push(user.user.id);
            this.printBanList(discord_client, msg, ban_list, `Added user to ban_list -> ${user.user.username}#${user.user.discriminator}`);
        }
    },
    async getBanList() {
        let ban_list = [];

        try {
            (await db.doc('lists/ban_list').get())._fieldsProto.members.arrayValue.values.forEach(m => {
                ban_list.push(m.stringValue);
            });
        }
        catch (err) {
            console.log(err);
        }

        return ban_list;
    },
    async printBanList(discord_client, msg, ban_list, description) {
        let banlistEmbed = new MessageEmbed()
            .setColor(`#000000`)
            .setTitle(`Confessions Ban_List`)
            .setDescription(description)
            .setFooter({ text: `Beans Staff Message` })
            .setTimestamp();

        if (ban_list.length == 0) {
            banlistEmbed.addField('[none]', '[none]', true);
        }
        else if (ban_list.length >= 1) {
            for (member of ban_list) {
                let user = (await discord_client.guilds.cache.get(process.env.server_id).members.fetch()).find(u => u.user.id == member);
                banlistEmbed.addField(user.user.username, member, true);
            }
        }

        let bot_log = msg.client.guilds.cache.get(process.env.server_id).channels.cache.get(process.env.discord_bot_log_id);

        bot_log.send({ embeds: [banlistEmbed] });

        if (msg.channel != bot_log) {
            msg.channel.send("User specific information has been sent to bot_log.")
        }
    }
}