module.exports = {
    name: 'lootbox',
    alias: ['cook', 'lb', 'roll'],
    description: "rolls for 20000 collectibles",
    category: 'collectibles',
    admin: false,
    type: "test",
    cooldown: 3,
    async execute(discord_client, msg, args, admin) {
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        }); // firestore credentials

        let card_cost = 1000;

        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown
        if (!(await require('../utility/credits').transaction(discord_client, msg, card_cost))) return; // credits manager validates transaction

        let roll_num = Math.floor(Math.random() * 20000) + 1; // [1, 20000]
        try {
            var character_ref = (await db.collection('edition_one').where("owner_id", "==", "").where("rank", ">=", roll_num).orderBy("rank", "asc").limit(1).get())._docs()[0]; // retrieve character from database
            var character = character_ref._fieldsProto;
            if (character == null) throw 'null character';
        }
        catch (err) {
            msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - System Error: Anime API Failed`);
            await require('../utility/credits').refund(discord_client, msg.author.id, card_cost); // credits manager refunds on error
            return;
        }

        require('../utility/embeds').print_lootbox(msg, character); // embeds manager prints lootbox card

        const res = await db.collection('edition_one').doc(`${character_ref._ref._path.segments[1]}`).update({ // updates owner_id on character_ref card in database
            owner_id: msg.author.id.toString(),
            owned: true,
        }).catch(err => msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - This product wasn't stored properly. Please contact Sore#1414.`));
    }
}