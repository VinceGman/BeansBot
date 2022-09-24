// https://console.cloud.google.com/apis/dashboard?project=beans-326017&show=all
// https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

module.exports = {
    name: 'stimulus',
    description: "give everyone money",
    admin: true,
    type: "production",
    async execute(discord_client, msg, args, admin) {
        if (args.length != 1) return;
        if (isNaN(args[0])) return;
        let members = await db.collection('members').get();
        members._docs().forEach(member => {
            this.stimmy(member, +args[0]);
        });
        msg.channel.send(`Stimulus Given: ${args[0]}`);
    },
    async stimmy(member, amount) {
        const res = await db.collection('members').doc(`${member._ref._path.segments[1]}`).update({
            credits: (+member._fieldsProto.credits.stringValue + amount).toString()
        });
    }
}