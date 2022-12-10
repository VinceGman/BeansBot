
// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const blackjack = require("discord-blackjack");

module.exports = {
    name: 'blackjack',
    alias: ['bj'],
    options: ['b'],
    description: "play blackjack (hit, stand) or use +bjb or +blackjackb for buttons",
    admin: false,
    type: "test",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        if (!require('../utility/timers').timer(msg, this.name, this.cooldown)) return; // timers manager checks cooldown

        let bet = 10000;
        if (args.length == 1 && !isNaN(args[0]) && +args[0] > 0) {
            bet = +args[0];
        }

        if (!(await require('../utility/credits').transaction(msg, bet))) return; // credits manager validates transaction

        let options = require('../utility/parsers').parse_command(msg, this.name, this.alias);
        let buttons = options.includes('b') ? true : false;
        let result = await blackjack(msg, { buttons: buttons, split: false, doubledown: false });

        switch (result.result) {
            case 'WIN':
                await require('../utility/credits').refund(msg.author.id, bet * 2); // credits manager refunds
                break;
            case 'TIE':
                await require('../utility/credits').refund(msg.author.id, bet); // credits manager refunds
                break;
            case 'LOSE':
            case 'CANCEL':
            case 'TIMEOUT':
                // nothing
                break;
            default:
                await require('../utility/credits').refund(msg.author.id, bet); // credits manager refunds
                msg.channel.send(`${msg.author.username}#${msg.author.discriminator} - Error: Credits Refunded`);
        }

        return;
    }
}