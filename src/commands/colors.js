// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'colors',
    alias: ['color', 'color:'],
    description: "color assignment and creation",
    category: 'utility',
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        try {
            let color_count;
            let price;
            let create_price_text;

            if (args.length == 0) {
                color_count = (await db.collection(`colors`).where('owner_id', '==', msg.author.id).where('server_id', '==', msg.guild.id).get())?._docs()?.length ?? 0;
                price = color_count == 0 ? 0 : 200000;
                create_price_text = color_count == 0 ? '**Free** (First Color)' : '200,000 credits';

                let color_guide = new EmbedBuilder()
                    .setColor('#000000')
                    .addFields({ name: '> Assign Color', value: `> see available: http://www.coffeebeansclub.com/`, inline: false })
                    .addFields({ name: 'Example', value: `use -> **+color red**`, inline: true })
                    .addFields({ name: 'Cost', value: '10,000 credits', inline: true })
                    .addFields({ name: '\u200B', value: '\u200B', inline: false })
                    .addFields({ name: '> Create Color', value: `> pick hex code: https://colorpicker.me/`, inline: false })
                    .addFields({ name: 'Example', value: `use -> **+color #4885e8 Blue**`, inline: true })
                    .addFields({ name: 'Cost', value: `${create_price_text}`, inline: true })
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                msg.channel.send({ embeds: [color_guide] });
                return;
            }

            if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

            const { validateHTMLColorHex } = require("validate-color");
            if (!validateHTMLColorHex(args[0])) {
                await this.assign(discord_client, msg, args);
                return;
            }

            if (args.length < 2) {
                msg.channel.send('For correct format, See -> **+colors**');
                return;
            }

            let color_hex = args[0];
            args.shift();
            let name = args.join(' ');

            let banned_words = ['admin', 'mod', 'booster', 'patron', 'level', 'color', 'opt', '/', 'undefined', 'null', 'flag'];
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
            color_hex = Color(color_hex).hex();
            let color = Color(color_hex).hsv().color;
            if (color[1] < 20 || color[1] > 80 || color[2] < 60) {
                msg.channel.send('The restrictions for HSV: S must be between 20-80 and V must be 60 or over.');
                return;
            }


            let role = await msg.guild.roles.cache.some(role => role.name.toLowerCase().startsWith('color: ') && role.name.toLowerCase().replace('color: ', '') == name.toLowerCase())
            if (role) {
                msg.channel.send('This role name is already being used.');
                return;
            }

            color_count = (await db.collection(`colors`).where('owner_id', '==', msg.author.id).where('server_id', '==', msg.guild.id).get())?._docs()?.length ?? 0;
            price = color_count == 0 ? 0 : 200000;
            create_price_text = color_count == 0 ? '**Free** (First Color)' : '200,000 credits';

            if (msg.author.id == '427677302608887810' || msg.author.id == '183019001058689025') {
                price = 0;
                create_price_text = '**Free** (Admin)';
            }

            if (!(await require('../utility/credits').transaction(discord_client, msg, price))) return; // credits manager validates transaction

            await this.create_doc(msg, color_hex, name);
            await this.create_role(msg, color_hex, name);

            let color_embed = new EmbedBuilder()
                .setTitle('New Color')
                .setDescription(`Assign with -> **+color ${name}**`)
                .setColor(color_hex)
                .addFields({ name: `Cost`, value: `${create_price_text}` })
                .setFooter({ text: `Created By: ${msg.author.username}` })
                .setTimestamp();

            msg.channel.send({ embeds: [color_embed] });
            return;
        }
        catch (err) {
            msg.channel.send('Something went wrong with color creation.');
            return;
        }

    },
    async create_doc(msg, color_hex, name) {
        const res = await db.collection('colors').add({
            hex: color_hex,
            name: name,
            owner_id: msg.author.id.toString(),
            server_id: msg.guild.id.toString(),
        });

    },
    async create_role(msg, color_hex, name) {
        let role_count = (await msg.guild.roles.fetch()).size - 8;
        await msg.guild.roles.create({
            color: color_hex,
            name: `Color: ${name}`,
            position: role_count,
            permissions: '0',
        });
    },
    async assign(discord_client, msg, args) {
        try {
            let color = args.join(' ');

            let role = msg.guild.roles.cache.find(r => r.name.toLowerCase().startsWith('color: ') && r.name.toLowerCase().includes(color.toLowerCase()));
            let role_db = (await db.collection(`colors`).where('name', '==', role?.name?.replace('color: ', '').replace('Color: ', '')).get())?._docs()?.[0]?.data();

            if (!role_db || !role) {
                let color_embed = new EmbedBuilder()
                    .setTitle(`Color Not Found`)
                    .setDescription(`N/A: ${color}`)
                    .setColor(`#000000`)
                    .setDescription(`For correct format, See -> **+colors**`)
                    .setFooter({ text: `${msg.author.username}` })
                    .setTimestamp();

                msg.channel.send({ embeds: [color_embed] });
                return;
            }

            let user = await msg.guild.members.fetch(msg.author.id);

            let removing = false;
            user.roles.cache.forEach(r => {
                if (r.name.toLowerCase().startsWith('color: ')) {
                    if (r.name.toLowerCase().includes(color.toLowerCase())) {
                        removing = true;
                    }
                    user.roles.remove(r);
                }
            });

            let color_embed = new EmbedBuilder()

            let assign_or_remove = 'Removed';
            if (!removing) {
                if (msg.author.id != role_db.owner_id) {
                    if (!(await require('../utility/credits').transaction(discord_client, msg, 10000))) return; // credits manager validates transaction
                    await require('../utility/credits').refund(discord_client, role_db.owner_id, 10000); // credits manager refunds creditsFF
                }
                user.roles.add(role);
                assign_or_remove = 'Assigned';
            }

            color_embed.setColor(`#${role.color.toString(16).padStart(6, '0').toUpperCase()}`)
                .addFields({ name: `${assign_or_remove}`, value: `${role.name}`, inline: true })
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();

            if (!removing) {
                if (msg.author.id != role_db.owner_id) {
                    color_embed.addFields({ name: 'Cost', value: '10000', inline: true });
                }
                else {
                    color_embed.addFields({ name: 'Cost', value: 'Free', inline: true });
                }
            }

            msg.channel.send({ embeds: [color_embed] });
            return;
        }
        catch (err) {
            msg.channel.send('Something went wrong with color assignment.');
            return;
        }
    },
    // async delete(msg) {
    //     try {
    //         let role_db_ref = (await db.collection(`colors`).where('owner', '==', msg.author.id).get())?._docs()?.[0]
    //         let role_db = role_db_ref?.data();
    //         let role = msg.guild.roles.cache.find(r => r.name.toLowerCase().startsWith('color: ') && r.name.toLowerCase().includes(role_db?.name?.toLowerCase()));

    //         await db.doc(`colors/${role_db_ref._ref._path.segments[1]}`).delete();
    //         await msg.guild.roles.delete(role);
    //     }
    //     catch (err) {
    //         msg.channel.send('Something went wrong with color deletion.');
    //         console.log(err);
    //         return;
    //     }
    // }
}

// for (let i = 54; i <= 64; i++) {
//     await msg.guild.roles.create({
//         name: `Color: `,
//         position: i + 1,
//         permissions: '0',
//     });
// }


// make the person know they lost money