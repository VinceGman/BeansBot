// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'colors',
    alias: ['color'],
    options: ['u'],
    description: "color creation and assignment",
    category: 'utility',
    admin: false,
    type: "test",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        try {

            const { MessageEmbed } = require('discord.js');

            if (args.length == 0) {
                let color_guide = new MessageEmbed()
                    .setTitle(`Color Guide`)
                    .setDescription(`Colors -> http://www.coffeebeansclub.com/`)
                    .setColor('#000000')
                    .addField('+color snow', `assigns **color: snow**`, false)
                    .setFooter({ text: `${msg.author.username}#${msg.author.discriminator}` })
                    .setTimestamp();

                msg.channel.send({ embeds: [color_guide] });
                return;
            }

            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            const { validateHTMLColorHex } = require("validate-color");
            if (!validateHTMLColorHex(color_hex)) {
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

            const Color = require('color');
            let color = Color(color_hex).hsv().color;
            if (color[2] < 40) {
                msg.channel.send('This color is too dark.');
                return;
            }

            let color_count = (await db.collection(`colors`).where('owner', '==', msg.author.id).get())?._docs()?.length ?? 0;
            if (color_count > 1) {
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

            if (!(await require('../utility/credits').transaction(discord_client, msg, price))) return; // credits manager validates transaction

            await this.create_doc(msg, color_hex, name, shareable);
            await this.create_role(msg, color_hex, name);

            let color_embed = new MessageEmbed()
                .setTitle(name)
                .setDescription(`Created By: ${msg.author.username}#${msg.author.discriminator}`)
                .setColor(color_hex)
                .setFooter({ text: `${color_text}` })
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
        await msg.guild.roles.create({
            color: color_hex,
            name: `Color: ${name}`,
            position: 70,
            permissions: '0',
        });
    },
    async assign(msg, args) {
        try {
            let color = args.join(' ');

            let role = msg.guild.roles.cache.find(r => r.name.toLowerCase().includes('color: ') && r.name.toLowerCase().includes(color.toLowerCase()));

            if (!role) {
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
            msg.channel.send('Something went wrong with color creation.');
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
