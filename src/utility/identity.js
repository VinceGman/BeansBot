module.exports = {
    async identity(id) {
        // dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
        const { Firestore } = require('@google-cloud/firestore');
        const db = new Firestore({
            projectId: 'beans-326017',
            keyFilename: './service-account.json'
        });

        let identity = {};

        let db_user = (await db.doc(`members/${id}`).get())._fieldsProto ?? { credits: { stringValue: '12000', valueType: 'stringValue' } };
        Object.keys(db_user).forEach(att => identity[att] = db_user[att][db_user[att].valueType]);

        return identity;
    }
}