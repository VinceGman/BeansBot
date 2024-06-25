// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { EmbedBuilder } = require('@discordjs/builders');
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

let _ = require('lodash');

const { WebhookClient } = require('discord.js');
const webhook_clients = new Map();

module.exports = {
    async direct_message(msg) {
        if (msg.content.toLowerCase().startsWith('+location')) {
            await this.locations(msg);
            return;
        }
        let self = false;
        try {
            switch (msg.content.toLowerCase()) {
                case '+alter':
                    await this.alter(msg);
                    return;
                case '+characters':
                    await this.characters(msg);
                    return;
            }
        }
        catch (err) {
            msg.channel.send('An issue occured with your War command.');
            return;
        }

        try {
            let content = msg.content;
            if (content.startsWith("// ")) {
                content = content.substring(3).trim();
            } else if (content.startsWith("//s ")) {
                content = content.substring(4).trim();
                self = true;
            } else if (content.startsWith("//x ")) {
                content = content.substring(4).trim();
                this.improvised(msg, content, self);
                return; // Stop further processing
            } else if (content.startsWith("//d ")) {
                content = content.substring(4).trim();
                this.determined(msg, content, self);
                return; // Stop further processing
            } else if (content.startsWith("//sx ") || content.startsWith("//xs ")) {
                content = content.substring(5).trim();
                self = true;
                this.improvised(msg, content, self);
                return; // Stop further processing
            } else if (content.startsWith("//sd ") || content.startsWith("//ds ")) {
                content = content.substring(5).trim();
                self = true;
                this.determined(msg, content, self);
                return; // Stop further processing
            } else {
                return;
            }

            if (content == '') return;

            let characters = (await db.collection(`characters`).where('owner_id', '==', msg.author.id).where('main', '==', true).get()).docs.map(char => char.data());

            if (characters.length > 1) {
                msg.channel.send('You have more than one character.');
                return;
            }

            let char = characters[0];

            if (char.channel_id != msg.channel.id) {
                // console.log('This is not a character channel.');
                return;
            }

            await this.distribute(msg, char, content, self);

            if (msg) msg.delete();
        }
        catch (err) {
            msg.channel.send('There was an error sending your msg.');
            console.log(err);
            return;
        }
    },
    async distribute(msg, char, content, self = false) {
        let characters = (await db.collection(`characters`).where('location', '==', char.location).get()).docs.map(char => char.data());
        let channel_ids = _.uniq(characters.map(char => char.channel_id));

        if (self) {
            channel_ids = [char.channel_id];
        }

        for (let recipient_channel_id of channel_ids) {

            if (!webhook_clients.has(recipient_channel_id)) {
                console.log('Did not find corresponding webhook in Map.');

                let webhook = (await db.doc(`webhooks/${recipient_channel_id}`).get()).data();
                if (!webhook) {
                    console.log('Did not find corresponding webhook in Database.');
                    let channel = await msg.guild.channels.fetch(recipient_channel_id);
                    const newWebhook = await channel.createWebhook({ name: recipient_channel_id });

                    webhook = {
                        channel_id: recipient_channel_id,
                        id: newWebhook.id,
                        token: newWebhook.token,
                    };

                    await db.doc(`webhooks/${recipient_channel_id}`).set(webhook, { merge: true });

                    console.log('Made a new webhook.');
                }

                const webhookClient = new WebhookClient({ id: webhook.id, token: webhook.token });
                webhook_clients.set(recipient_channel_id, webhookClient);
            }

            let individualized_content = content;

            try {
                let username = char.name;
                let avatarURL = char.image;

                if (char?.alter?.active) {
                    username = `${char.name} (Alter)`;
                    avatarURL = char?.alter?.alter_image ?? char.image;
                }

                let roll = false;
                if (['str', 'end', 'agl', 'mna', 'lck'].includes(individualized_content.toLowerCase())) {
                    roll = true;
                    let stat = char.stats[individualized_content.toLowerCase()];
                    if (stat && !isNaN(stat)) {
                        let roll_num = Math.floor(Math.random() * 20) + 1; // [1, 20]
                        let unknown_bonus = char?.unknown ? char.stats.lck : 0;
                        let unknown_text = unknown_bonus > 0 ? ` + ${unknown_bonus}` : '';
                        individualized_content = `\`${individualized_content.toUpperCase()} Check: ${roll_num} + ${stat}${unknown_text} = ${roll_num + +stat + unknown_bonus}\``;
                    }
                    else {
                        msg.channel.send('Your character does not have this stat recorded.');
                        return;
                    }
                }

                if (self) {
                    individualized_content += `\n\n> *Only you can see this message.*`;
                }

                if (char.hasOwnProperty('only_to') && (individualized_content.includes(`"`) || individualized_content.includes(`“`))) {
                    if (recipient_channel_id == char.only_to) {
                        individualized_content += `\n\n> *Only you can understand this message.*`;
                    }
                    else {
                        if (char.hasOwnProperty('show_at_location') && char.show_at_location && char.hasOwnProperty('show_text')) {
                            individualized_content = char.show_text;
                        }
                        else {
                            continue;
                        }
                    }
                }

                let recipient_webhook_client = webhook_clients.get(recipient_channel_id);
                await recipient_webhook_client.send({
                    content: individualized_content,
                    username: username,
                    avatarURL: avatarURL,
                });
            }
            catch (err) {
                msg.channel.send(`This message could not be sent to recipient: ${recipient_channel_id}.`);
                console.log(err);
            }
        }
    },
    async alter(msg) {
        let characters = (await db.collection(`characters`).where('owner_id', '==', msg.author.id).where('main', '==', true).get()).docs.map(char => { return { ...char.data(), id: char.id } });
        let char = characters[0];

        if (!char.hasOwnProperty('alter')) return;

        char.alter.active = !char.alter.active;
        await db.doc(`characters/${char.id}`).set(char, { merge: true });

        let content = char.alter.active ? '*Alter.*' : '*Restore.*';
        await this.distribute(msg, char, content, true);

        if (msg) msg.delete();

        return;
    },
    async improvised(msg, content, self) {
        try {
            let char = {
                owner_id: msg.author.id,
                channel_id: msg.channel.id,
                image: 'https://i1.wp.com/cornellsun.com/wp-content/uploads/2020/06/1591119073-screen_shot_2020-06-02_at_10.30.13_am.png?fit=700%2C652&ssl=1',
                location: await this.location_from_channel_id(msg.channel.id),
            }

            let args = content.split('\n');
            content = '';
            for (let i = 0; i < args.length; i++) {
                if (i == 0) {
                    char.name = args[i];
                }
                else if (args[i].startsWith('image:')) {
                    char.image = args[i].replace('image:', '').trim();
                }
                else if (args[i].startsWith('location:')) {
                    char.image = args[i].replace('location:', '').trim();
                }
                else {
                    content += `${args[i]}\n`;
                }
            }

            content = content.trim();
            await this.distribute(msg, char, content, self);
        }
        catch (err) {
            // silent
        }

        if (msg) msg.delete();
        return;
    },
    async determined(msg, content, self) {
        let args = content.split('\n');
        let characters = (await db.collection(`characters`).where('name', '==', args[0].trim()).get()).docs.map(char => char.data());
        if (characters.length == 1) {
            characters[0].location = await this.location_from_channel_id(msg.channel.id);
            args.shift();
            await this.distribute(msg, characters[0], args.join('\n').trim(), self);
            if (msg) msg.delete();
            return;
        }

        try {
            let char = {
                owner_id: msg.author.id,
                channel_id: msg.channel.id,
                image: 'https://i1.wp.com/cornellsun.com/wp-content/uploads/2020/06/1591119073-screen_shot_2020-06-02_at_10.30.13_am.png?fit=700%2C652&ssl=1',
                location: await this.location_from_channel_id(msg.channel.id),
            }

            content = '';
            for (let i = 0; i < args.length; i++) {
                if (i == 0) {
                    char.name = args[i];
                }
                else if (args[i].startsWith('image:')) {
                    char.image = args[i].replace('image:', '').trim();
                }
                else if (args[i].startsWith('location:')) {
                    char.image = args[i].replace('location:', '').trim();
                }
                else {
                    content += `${args[i]}\n`;
                }
            }

            await db.collection(`characters`).add(char);

            content = content.trim();
            await this.distribute(msg, char, content, self);
        }
        catch (err) {
            // silent
        }

        if (msg) msg.delete();
        return;
    },
    async location_from_channel_id(id) {
        let characters = (await db.collection(`characters`).where('channel_id', '==', id).where('main', '==', true).get()).docs.map(char => char.data());
        return characters[0].location;
    },
    async locations(msg) {
        if (msg.content.toLowerCase().startsWith('+locations')) {
            let output = '';
            let characters = (await db.collection(`characters`).where('main', '==', true).get()).docs.map(char => char.data());
            for (let char of characters) {
                output += `${char.name} - location: ${char.location}\n`;
            }
            msg.channel.send(output);
            return;
        }
        else if (msg.content.toLowerCase().startsWith('+location')) {
            let characters = (await db.collection(`characters`).where('channel_id', '==', msg.channel.id).where('main', '==', true).get()).docs.map(char => { return { ...char.data(), id: char.id } });
            let char = characters[0];
            let content = msg.content.replace('+location', '').trim();
            char.location = content;
            await db.doc(`characters/${char.id}`).set(char, { merge: true });
            if (msg) msg.delete();
            return;
        }
    },
    async characters(msg) {
        let output = '';
        let characters = (await db.collection(`characters`).where('owner_id', '==', msg.author.id).get()).docs.map(char => char.data());
        for (let char of characters) {
            output += `${char.name} - location: ${char.location}\n`;
        }
        msg.channel.send(output);
        return;
    }
}