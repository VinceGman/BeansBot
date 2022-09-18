const { MessageEmbed } = require('discord.js');

// https://console.cloud.google.com/apis/dashboard?project=beans-326017&show=all
// https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'secretsanta',
    description: "secretsanta to trade pfps",
    admin: false,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        // let secretsanta = await this.getsecretsanta();

        // if (args.length == 0 || args.length >= 2) {
        //     this.printsecretsanta(discord_client, msg, secretsanta, `+secretsanta (options) | join/leave | start`);
        //     return;
        // }
        // else if (args.length == 1) {
        //     if (args[0] == 'show') {
        //         this.printsecretsanta(discord_client, msg, secretsanta, `+secretsanta (options) | join/leave | start`);
        //         return;
        //     }
        //     else if (args[0] == 'join') {
        //         let user = msg.author;

        //         if (!secretsanta.includes(user.id)) {
        //             await db.doc('lists/secret_santa').update({
        //                 members: FieldValue.arrayUnion(user.id)
        //             });
        //             secretsanta.push(user.id);
        //             this.printsecretsanta(discord_client, msg, secretsanta, `Added user -> ${user.username}#${user.discriminator}`);
        //         }
        //         else {
        //             this.printsecretsanta(discord_client, msg, secretsanta, `User already joined.`);
        //         }

        //         return;
        //     }
        //     else if (args[0] == 'leave') {
        //         let user = msg.author;

        //         if (secretsanta.includes(user.id)) {
        //             await db.doc('lists/secret_santa').update({
        //                 members: FieldValue.arrayRemove(user.id)
        //             });
        //             secretsanta = secretsanta.filter(value => value != user.id);
        //             this.printsecretsanta(discord_client, msg, secretsanta, `Removed user -> ${user.username}#${user.discriminator}`);
        //         }
        //         else {
        //             this.printsecretsanta(discord_client, msg, secretsanta, `User has not joined.`);
        //         }

        //         return;
        //     }
        //     else if (args[0] == 'start') {
        //         if (!admin) {
        //             msg.channel.send('An admin must start the secret santa.');
        //             return;
        //         }
        //         if (secretsanta.length <= 2) {
        //             msg.channel.send('There must be at least 3 players in the secret santa to start.');
        //             return;
        //         }
        //         let edges = []; // maintains possible edges
        //         let final = []; // maintains final edge config
        //         for (let i = 0; i < secretsanta.length; i++) {
        //             edges.push([...secretsanta].filter(m => m != secretsanta[i])); // creates possible edges array for each element
        //         }
        //         for (let i = 0; i < secretsanta.length; i++) {
        //             let pick = Math.floor(Math.random() * edges[i].length); // grabs random edge
        //             for (j = i + 1; j < edges.length; j++) {
        //                 edges[j] = [...edges[j]].filter(m => m != edges[i][pick]); // deletes random edge from all other edge lists
        //             }
        //             final.push([secretsanta[i], edges[i][pick]]); // pushes picked edge to final config

        //             if (final[i][1] == undefined) { // if last element undefined edge
        //                 let swap = Math.floor(Math.random() * (secretsanta.length - 1)); // picks another element to swap edge with
        //                 final[i][1] = final[swap][1]; // undefined edge gets swapped edge
        //                 final[swap][1] = secretsanta[i]; // swapped edge gets last edge
        //             }
        //         }

        //         // clears secretsanta
        //         await db.doc('lists/secret_santa').set({
        //             members: []
        //         });

        //         for (let i = 0; i < final.length; i++) {
        //             let one_who_gifts = (await discord_client.guilds.cache.get(process.env.server_id).members.fetch()).find(u => u.user.id == final[i][0]);
        //             let one_who_receives = (await discord_client.guilds.cache.get(process.env.server_id).members.fetch()).find(u => u.user.id == final[i][1]);
        //             one_who_gifts.send(`You must gift **${one_who_receives.user.username}#${one_who_receives.user.discriminator}** for secret santa.`);
        //         }

        //         let secretsantaEmbed = new MessageEmbed()
        //             .setColor(`#000000`)
        //             .setTitle(`Secret Santa`)
        //             .setDescription(`Secret Santa has begun. You'll receive a direct message from **Beans#8062** with your chosen person.`)
        //             .setFooter({ text: `Beans Staff Message` })
        //             .setTimestamp();

        //         msg.channel.send({ embeds: [secretsantaEmbed] });

        //         return;
        //     }
        // }
    },
    async getsecretsanta() {
        let secretsanta = [];

        try {
            (await db.doc('lists/secret_santa').get())._fieldsProto.members.arrayValue.values.forEach(m => {
                secretsanta.push(m.stringValue);
            });
        }
        catch (err) {
            console.log(err);
        }

        return secretsanta;
    },
    async printsecretsanta(discord_client, msg, secretsanta, description) {
        let secretsantaEmbed = new MessageEmbed()
            .setColor(`#000000`)
            .setTitle(`Secret Santa`)
            .setDescription(description)
            .setFooter({ text: `Beans Staff Message` })
            .setTimestamp();

        if (secretsanta.length == 0) {
            secretsantaEmbed.addField('[none]', '[none]', true);
        }
        else if (secretsanta.length >= 1) {
            for (member of secretsanta) {
                let user = (await discord_client.guilds.cache.get(process.env.server_id).members.fetch()).find(u => u.user.id == member);
                secretsantaEmbed.addField(user.user.username, ':white_check_mark:', true);
            }
        }

        msg.channel.send({ embeds: [secretsantaEmbed] });
    }
}