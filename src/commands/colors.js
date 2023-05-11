// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'colors',
    alias: ['color'],
    options: ['u'],
    description: "color creation and assignment",
    category: 'utility',
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        try {
            if (args.length == 0) {
                let color_guide = new MessageEmbed()
                    .setTitle(`Color Guide`)
                    .setDescription(`Create your own color.`)
                    .setColor('#000000')
                    .addField('\u200B', '\u200B', false)
                    .addField('+color neptune', `assigns -> **Color: Neptune**`, false)
                    .addField('\u200B', '\u200B', false)
                    .addField('+color <hex> <name> | +color #4885e8 Blue', `creates -> **Color: Blue**\n**Anyone** can use it.\nCosts **200k** credits.`, false)
                    .addField('\u200B', '\u200B', false)
                    .addField('+coloru <hex> <name> | +coloru #c4375f rose petals', `creates -> **Color: rose petals**\n**Only you** can use it.\nCosts **500k** credits.`, false)
                    .addField('\u200B', '\u200B', false)
                    .addField('+color delete', 'Deletes your current color so you can make another.')
                    .addField('\u200B', '\u200B', false)
                    .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                    .setTimestamp();

                msg.channel.send({ embeds: [color_guide] });
                return;
            }

            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            if (args.length == 1 && args[0].toLowerCase() == 'delete') {
                await this.delete(msg);
                return;
            }

            const { validateHTMLColorHex } = require("validate-color");
            if (!validateHTMLColorHex(args[0])) {
                await this.assign(msg, args);
                return;
            }

            if (args.length < 2) {
                msg.channel.send('For correct format, See -> **+colors**');
                return;
            }

            let color_hex = args[0];
            args.shift();
            let name = args.join(' ');

            let banned_words = ['admin', 'mod', 'booster', 'patron', 'level', 'color', 'opt', '/', 'undefined', 'null'];
            let banned = false;

            for (let word of banned_words) {
                if (name.toLowerCase().includes(word)) {
                    banned = true;
                }
            }

            if (banned) {
                msg.channel.send('A banned word was present in this name. Try a different one.');
                return;
            }

            const Color = require('color');
            let color = Color(color_hex).hsv().color;
            if (color[2] < 40 && (msg.author.id != msg.guild.ownerId || !admin)) {
                msg.channel.send('This color is too dark.');
                return;
            }

            let color_count = (await db.collection(`colors`).where('owner', '==', msg.author.id).get())?._docs()?.length ?? 0;
            if (color_count > 1 && (msg.author.id != msg.guild.ownerId || !admin)) {
                msg.channel.send(`You've already created a color.`);
                return;
            }

            let role = await msg.guild.roles.cache.some(role => role.name.toLowerCase().includes(name.toLowerCase()))
            if (role) {
                msg.channel.send('This role name is already being used.');
                return;
            }

            let price = 200000;
            let shareable = true;
            let color_text = 'New Public Color';

            let options = require('../utility/parsers').parse_command(msg, this.name, this.alias);
            if (options.includes('u')) {
                price = 500000;
                shareable = false;
                color_text = 'New Unique Color';
            }

            if (admin) {
                price = 0;
            }

            if (!(await require('../utility/credits').transaction(discord_client, msg, price))) return; // credits manager validates transaction

            await this.create_doc(msg, color_hex, name, shareable);
            await this.create_role(msg, color_hex, name);

            let color_embed = new MessageEmbed()
                .setTitle(color_text)
                .setDescription(`Assign with -> **+color ${name}**`)
                .setColor(color_hex)
                .setFooter({ text: `Created By: ${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [color_embed] });

        }
        catch (err) {
            msg.channel.send('Something went wrong with color creation.');
            return;
        }

    },
    async create_doc(msg, color_hex, name, shareable) {
        const res = await db.collection('colors').add({
            hex: color_hex,
            name: name,
            owner: msg.author.id.toString(),
            shareable: shareable,
        });

    },
    async create_role(msg, color_hex, name) {
        let role_count = (await msg.guild.roles.fetch()).size - 1;
        await msg.guild.roles.create({
            color: color_hex,
            name: `Color: ${name}`,
            position: role_count,
            permissions: '0',
        });
    },
    async assign(msg, args) {
        try {
            let color = args.join(' ');

            let role = msg.guild.roles.cache.find(r => r.name.toLowerCase().includes('color: ') && r.name.toLowerCase().includes(color.toLowerCase()));
            let role_db = (await db.collection(`colors`).where('name', '==', role?.name?.replace('color: ', '').replace('Color: ', '')).get())?._docs()?.[0]?.data();

            if (!role_db || !role) {
                let color_embed = new MessageEmbed()
                    .setTitle(`Color Not Found`)
                    .setDescription(`N/A: ${color}`)
                    .setColor(`#000000`)
                    .setDescription(`For correct format, See -> **+colors**`)
                    .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                    .setTimestamp();

                msg.channel.send({ embeds: [color_embed] });
                return;
            }
            else {
                if (role_db.owner != msg.author.id && role_db.shareable != true) {
                    msg.channel.send('This color is not shareable.');
                    return;
                }
            }

            let user = await msg.guild.members.fetch(msg.author.id);

            user.roles.cache.forEach(r => {
                if (r.name.toLowerCase().includes('color: ')) {
                    user.roles.remove(r);
                }
            });

            user.roles.add(role);

            let color_embed = new MessageEmbed()
                .setTitle(`Color Assigned`)
                .setColor(`#${role.color.toString(16).padStart(6, '0').toUpperCase()}`)
                .setDescription(`${role.name}`)
                .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                .setTimestamp();

            msg.channel.send({ embeds: [color_embed] });
            return;
        }
        catch (err) {
            msg.channel.send('Something went wrong with color assignment.');
            return;
        }
    },
    async delete(msg) {
        try {
            let role_db_ref = (await db.collection(`colors`).where('owner', '==', msg.author.id).get())?._docs()?.[0]
            let role_db = role_db_ref?.data();
            let role = msg.guild.roles.cache.find(r => r.name.toLowerCase().includes('color: ') && r.name.toLowerCase().includes(role_db?.name?.toLowerCase()));

            await db.doc(`colors/${role_db_ref._ref._path.segments[1]}`).delete();
            await msg.guild.roles.delete(role);
        }
        catch (err) {
            msg.channel.send('Something went wrong with color deletion.');
            console.log(err);
            return;
        }
    }
}

// for (let i = 54; i <= 64; i++) {
        //     await msg.guild.roles.create({
        //         name: `Color: `,
        //         position: i + 1,
        //         permissions: '0',
        //     });
        // }
