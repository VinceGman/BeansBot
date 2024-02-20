module.exports = {
    async user(id) { // returns the attributes of a user by id
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        let user = (await db.doc(`members/${id}`).get()).data() ?? {};
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
            var characters = (await db.collection(`edition_one`).where(attribute, '==', match.toLowerCase()).orderBy("rank", "asc").limit(limit).get())._docs();
            if (characters.length == 0) throw 'null character';
            characters.forEach((char, index, characters) => {
                characters[index] = char._fieldsProto;
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

        let attribute = 'origin_lower';
        let matches = require('./searches').compound_search('collection', args.join(' ').toLowerCase());

        let characters = [];
        for (let match of matches) {
            let db_characters = (await db.collection(`edition_one`).where(attribute, '==', match.toLowerCase()).orderBy("rank", "asc").limit(limit).get())._docs();
            db_characters.forEach((char, index, db_characters) => {
                db_characters[index] = char._fieldsProto;
                characters.push(db_characters[index]);
            });
        }
        return { matches: matches, characters: characters };
    },
    async owned_collection(msg, args, limit = 50) { // returns one to many characters by name
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        let attribute = 'origin_lower';
        let matches = require('./searches').compound_search('collection', args.join(' ').toLowerCase());

        let characters = [];
        for (let match of matches) {
            let db_characters = (await db.collection(`edition_one`).where(attribute, '==', match.toLowerCase()).where('owned', '==', true).orderBy("rank", "asc").limit(limit).get())._docs();
            db_characters.forEach((char, index, db_characters) => {
                db_characters[index] = char._fieldsProto;
                characters.push(db_characters[index]);
            });
        }
        return { matches: matches, characters: characters };
    },
}