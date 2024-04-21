module.exports = {
    async user(guildId, id) { // returns the attributes of a user by id
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        let user = (await db.doc(`servers/${guildId}/members/${id}`).get()).data() ?? {};
        user.credits = user.credits == null ? '0' : user.credits;
        return user;
    },
    async character(msg, args, limit = 15) { // returns one to many characters by id or name
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        let attribute, match;
        if (args.length == 1 && !isNaN(args[0].replace('#', ''))) {
            attribute = 'rank_text';
            match = args[0].replace('#', '');
        }
        else {
            attribute = 'name_lower';
            match = require('./searches').search('name', args.join(' ').toLowerCase())[0];
        }

        try {
            var characters = (await db.collection(`anime_cards`).where(attribute, '==', match.toLowerCase()).orderBy("rank", "asc").limit(limit).get())._docs();
            if (characters.length == 0) throw 'null character';
            characters.forEach((char, index, characters) => {
                characters[index] = char.data();
            });
            return characters;
        }
        catch (err) {
            msg.channel.send(`${msg.author.username} - No character found.`);
            return false;
        }
    },
    async owned_character(msg, args) { // returns a single owned character by id or name
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        let attribute, match;
        if (args.length == 1 && !isNaN(args[0].replace('#', '')) && args[0].replace('#', '').length <= 5 && +args[0].replace('#', '') <= 20000) {
            attribute = 'rank_text';
            match = args[0].replace('#', '');
        }
        else if (args.length == 1 && !isNaN(args[0]) && args[0].length == 6) {
            attribute = 'locked_id';
            match = args[0];
        }
        else {
            attribute = 'name_lower';
            match = require('./searches').search('name', args.join(' ').toLowerCase())[0];
        }

        try {
            var character = (await db.collection(`anime_cards`).where(`${msg.guildId}_owner_id`, '==', msg.author.id).where(attribute, '==', match.toLowerCase()).where(`${msg.guildId}_locked`, '==', attribute == 'locked_id' ? true : false).orderBy("rank", "asc").limit(1).get())._docs()[0];
            return character.data();
        }
        catch (err) {
            msg.channel.send(`${msg.author.username} - No character found.`);
            return false;
        }
    },
    async collection(msg, args, limit = 50) { // returns one to many characters by name
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        let matches = require('./searches').compound_search('collection', args.join(' ').toLowerCase());
        try {
            var characters = ((await db.collection(`anime_cards`).where('origin_lower', 'in', matches.map(m => m.toLowerCase())).orderBy("rank", "asc").limit(limit).get())._docs()).map(card => card.data());
            return { matches: matches, characters: characters };
        }
        catch (err) {
            msg.channel.send(`${msg.author.username} - No collection found.`);
            return false;
        }
    },
    async owned_collection(msg, args, limit = 50) { // returns one to many characters by name
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        let matches = require('./searches').compound_search('collection', args.join(' ').toLowerCase());
        try {
            var characters = ((await db.collection(`anime_cards`).where(`${msg.guildId}_owned`, '==', true).where(`${msg.guildId}_locked`, '==', false).where('origin_lower', 'in', matches.map(m => m.toLowerCase())).orderBy("rank", "asc").limit(limit).get())._docs()).map(card => card.data());
            return { matches: matches, characters: characters };
        }
        catch (err) {
            msg.channel.send(`${msg.author.username} - No collection found.`);
            return false;
        }
    },
}