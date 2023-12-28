// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'beans-326017',
    keyFilename: './service-account.json'
});

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'bank',
    description: "bank command",
    category: 'credits',
    admin: false,
    type: "production",
    cooldown: 6,
    async execute(discord_client, msg, args, admin) {
        let concluded = false;

        try {
            const filter = m => m.author.id == msg.author.id;
            const collector = msg.channel.createMessageCollector({ filter, time: 15000 });

            let bank_menu = new EmbedBuilder()
                .setTitle('Bank Accounts Menu')
                .setDescription(`Pick one below.`)
                .addFields({ name: `> deposit`, value: `Deposit credits to an account.`, inline: false })
                .addFields({ name: `> withdraw`, value: `Withdraw credits from an account.`, inline: false })
                .addFields({ name: `> create`, value: `Create an account.`, inline: false })
                .addFields({ name: `> delete`, value: `Delete an account.`, inline: false })
                .addFields({ name: `> joint`, value: `Add or Remove someone from your account.`, inline: false })
                .addFields({ name: `> show`, value: `Show your accounts.`, inline: false })
                .addFields({ name: `> close`, value: `Close the bank prompt.`, inline: false })
                .setColor('#ebcf34')
                .setFooter({ text: `${msg.author.username}` })
                .setTimestamp();
            msg.channel.send({ embeds: [bank_menu] });

            let action = '';
            let amount = '';
            let bank_account_number = '';
            let recipient = '';
            let name = '';
            let bank_account = '';

            collector.on('end', collected => {
                if (!concluded) this.bank_embeds(discord_client, msg, 'Bank prompt closed.');
                return;
            });

            collector.on('collect', async m => {
                collector.resetTimer();
                if (m.content.toLowerCase().includes('clear') || m.content.toLowerCase().includes('close') || m.content.toLowerCase().includes('+bank')) {
                    collector.stop();
                    return;
                }
                else if (m.content.toLowerCase().includes('show')) {
                    let show_bank_embed = new EmbedBuilder()
                        .setTitle(`Bank Accounts`)
                        .setColor('#ebcf34')
                        .setFooter({ text: `${msg.author.username}` })
                        .setTimestamp();

                    let db_bank_accounts = [...(await db.collection(`bank_accounts`).where('owner_id', '==', msg.author.id).get())._docs(), ...(await db.collection(`bank_accounts`).where('joint', 'array-contains', msg.author.id).get())._docs()];

                    if (db_bank_accounts.length == 0) {
                        show_bank_embed.setDescription('[none] -> **+bank**');
                    }
                    else {
                        for (let bank_acc of db_bank_accounts) {
                            bank_acc = bank_acc.data();
                            show_bank_embed.addFields({ name: `${bank_acc.name}`, value: `${bank_acc.balance}`, inline: false });
                        }
                    }

                    msg.channel.send({ embeds: [show_bank_embed] });
                    return;
                }
                else if (m.content.toLowerCase().includes('withdraw') || action == 'withdraw') {
                    if (action == 'withdraw') {
                        if (!isNaN(m.content) && bank_account_number == '') {
                            bank_account = (await db.doc(`bank_accounts/${m.content}`).get()).data() ?? {};
                            if (Object.keys(bank_account).length == 0) {
                                this.bank_embeds(discord_client, msg, `Account not found. Please provide your bank account number.`);
                                return;
                            }

                            if (bank_account.owner_id != msg.author.id && !bank_account.joint.includes(msg.author.id)) {
                                this.bank_embeds(discord_client, msg, `No access. Please provide your bank account number.`);
                                return;
                            }

                            bank_account_number = m.content;

                            this.bank_embeds(discord_client, msg, `Account: ${bank_account_number} - Provide amount you'd like to withdraw.`);
                            return;
                        }

                        if (bank_account_number == '') {
                            this.bank_embeds(discord_client, msg, `Please provide your bank account number.`);
                            return;
                        }

                        if (!isNaN(m.content) && amount == '') {
                            if (+m.content < 0) {
                                this.bank_embeds(discord_client, msg, `Your number must be positive. Provide amount you'd like to withdraw.`);
                                return;
                            }
                            if (m.content.includes('.')) {
                                this.bank_embeds(discord_client, msg, `Your number must be whole. Provide amount you'd like to withdraw.`);
                                return;
                            }

                            amount = +m.content;

                            if (await require('../utility/credits').bank_withdraw(discord_client, msg, amount, bank_account_number)) {
                                await require('../utility/credits').refund(discord_client, msg.author.id, amount);
                                this.bank_embeds(discord_client, msg, `${amount} withdrawn`);
                            }
                            concluded = true;
                            collector.stop();
                            return;
                        }

                        if (amount == '') {
                            this.bank_embeds(discord_client, msg, `Provide amount you'd like to withdraw.`);
                            return;
                        }

                        this.bank_embeds(discord_client, msg, `Did not understand, try again.`);
                        return;
                    }

                    action = 'withdraw';
                    this.bank_embeds(discord_client, msg, `Please provide bank account number.`);
                    return;
                }
                else if (m.content.toLowerCase().includes('deposit') || action == 'deposit') {
                    if (action == 'deposit') {
                        if (!isNaN(m.content) && bank_account_number == '') {
                            bank_account = (await db.doc(`bank_accounts/${m.content}`).get()).data() ?? {};
                            if (Object.keys(bank_account).length == 0) {
                                this.bank_embeds(discord_client, msg, `This account could not be found. Please provide bank account number.`);
                                return;
                            }

                            if (bank_account.owner_id != msg.author.id && !bank_account.joint.includes(msg.author.id)) {
                                this.bank_embeds(discord_client, msg, `You may not access this account. Please provide bank account number.`);
                                return;
                            }

                            bank_account_number = m.content;

                            this.bank_embeds(discord_client, msg, `Account: ${bank_account_number} - Provide amount you'd like to deposit.`);
                            return;
                        }

                        if (bank_account_number == '') {
                            this.bank_embeds(discord_client, msg, `Please provide bank account number.`);
                            return;
                        }

                        if (!isNaN(m.content) && amount == '') {
                            if (+m.content < 0) {
                                this.bank_embeds(discord_client, msg, `Your number must be positive. Provide amount you'd like to deposit.`);
                                return;
                            }
                            if (m.content.includes('.')) {
                                this.bank_embeds(discord_client, msg, `Your number must be whole. Provide amount you'd like to deposit.`);
                                return;
                            }

                            amount = +m.content;

                            if (await require('../utility/credits').transaction(discord_client, msg, amount)) {
                                await require('../utility/credits').bank_deposit(discord_client, msg, amount, bank_account_number);
                                this.bank_embeds(discord_client, msg, `${amount} deposited`);
                            }
                            concluded = true;
                            collector.stop();
                            return;
                        }

                        if (amount == '') {
                            this.bank_embeds(discord_client, msg, `Provide amount you'd like to deposit.`);
                            return;
                        }

                        this.bank_embeds(discord_client, msg, `Did not understand, try again.`);
                        return;
                    }

                    action = 'deposit';
                    this.bank_embeds(discord_client, msg, `Please provide bank account number.`);
                    return;
                }
                else if (m.content.toLowerCase().includes('joint') || action == 'joint') {
                    if (action == 'joint') {
                        if (!isNaN(m.content) && bank_account_number == '') {
                            bank_account = (await db.doc(`bank_accounts/${m.content}`).get()).data() ?? {};
                            if (Object.keys(bank_account).length == 0) {
                                this.bank_embeds(discord_client, msg, `This account could not be found. Please provide bank account number.`);
                                return;
                            }

                            if (bank_account.owner_id != msg.author.id) {
                                this.bank_embeds(discord_client, msg, `You are not the owner of this account. Please provide bank account number.`);
                                return;
                            }

                            bank_account_number = m.content;

                            this.bank_embeds(discord_client, msg, `account chosen: ${bank_account_number} - Provide user @ you'd like to add or remove from the account.`);
                            return;
                        }

                        if (bank_account_number == '') {
                            this.bank_embeds(discord_client, msg, `Please provide bank account number.`);
                            return;
                        }

                        if (m.mentions.users.size == 1 && recipient == '') {
                            if (recipient == m.author.id) {
                                this.bank_embeds(discord_client, msg, `Can't add yourself to the bank account.`);
                                return;
                            }

                            recipient = m.mentions.users.keys().next().value;

                            let add_or_remove = '';
                            if (bank_account.joint.includes(recipient)) {
                                add_or_remove = 'removed';
                                await db.doc(`bank_accounts/${bank_account_number}`).update({
                                    joint: FieldValue.arrayRemove(recipient)
                                });
                            }
                            else {
                                add_or_remove = 'added'
                                await db.doc(`bank_accounts/${bank_account_number}`).update({
                                    joint: FieldValue.arrayUnion(recipient)
                                });

                            }
                            this.bank_embeds(discord_client, msg, `${add_or_remove} ${recipient} to bank account.`);
                            concluded = true;
                            collector.stop();
                            return;

                        }

                        if (recipient == '') {
                            this.bank_embeds(discord_client, msg, `Please provide a user by @ing them.`);
                            return;
                        }

                        this.bank_embeds(discord_client, msg, `Did not understand, try again.`);
                        return;
                    }

                    action = 'joint';
                    this.bank_embeds(discord_client, msg, `Please provide bank account number.`);
                    return;
                }
                else if (m.content.toLowerCase().includes('create') || action == 'create') {
                    if (action == 'create') {
                        if (!isNaN(m.content) && bank_account_number == '') {
                            bank_account = (await db.doc(`bank_accounts / ${m.content} `).get()).data() ?? {};
                            if (Object.keys(bank_account).length != 0) {
                                this.bank_embeds(discord_client, msg, `This account already exists. Please create a new bank account number.`);
                                return;
                            }

                            if (m.content < 1000 || m.content > 9999) {
                                this.bank_embeds(discord_client, msg, `You must enter a 4 digit number. Please create a new bank account number.`);
                                return;
                            }

                            bank_account_number = m.content;

                            this.bank_embeds(discord_client, msg, `Account: ${bank_account_number} - Provide name for the created account.`);
                            return;
                        }

                        if (bank_account_number == '') {
                            this.bank_embeds(discord_client, msg, `Please create bank account number.`);
                            return;
                        }

                        if (isNaN(m.content) && name == '') {
                            name = m.content;

                            await db.doc(`bank_accounts/${bank_account_number}`).set({
                                balance: '0',
                                name: name,
                                owner_id: msg.author.id.toString(),
                                joint: [],
                            });
                            this.bank_embeds(discord_client, msg, `created bank account: ${name} `);
                            concluded = true;
                            collector.stop();
                            return;
                        }

                        if (name == '') {
                            this.bank_embeds(discord_client, msg, `Provide name you'd like to create.`);
                            return;
                        }

                        this.bank_embeds(discord_client, msg, `Did not understand, try again.`);
                        return;
                    }

                    let bank_count_check = (await db.collection(`bank_accounts`).where('owner_id', '==', msg.author.id).get())._docs().length;
                    if (bank_count_check >= 4) {
                        this.bank_embeds(discord_client, msg, `You've already made 4 accounts.`);
                        concluded = true;
                        collector.stop();
                        return;
                    }

                    action = 'create';
                    this.bank_embeds(discord_client, msg, `Please create bank account number.`);
                    return;
                }
                else if (m.content.toLowerCase().includes('delete') || action == 'delete') {
                    if (action == 'delete') {
                        if (!isNaN(m.content) && bank_account_number == '') {
                            bank_account = (await db.doc(`bank_accounts/${m.content}`).get()).data() ?? {};
                            if (Object.keys(bank_account).length == 0) {
                                this.bank_embeds(discord_client, msg, `This account could not be found. Please provide bank account number.`);
                                return;
                            }

                            if (bank_account.owner_id != msg.author.id) {
                                this.bank_embeds(discord_client, msg, `You are not the owner of this account. Please provide bank account number.`);
                                return;
                            }

                            bank_account_number = m.content;

                            this.bank_embeds(discord_client, msg, `Account: ${bank_account_number} - Provide the name of the account.`);
                            return;
                        }

                        if (bank_account_number == '') {
                            this.bank_embeds(discord_client, msg, `Please provide bank account number.`);
                            return;
                        }

                        if (isNaN(m.content) && name == '') {
                            if (m.content != bank_account.name) {
                                this.bank_embeds(discord_client, msg, `You must type the exact name of the account to delete it.`);
                                return;
                            }

                            name = m.content;

                            await db.doc(`bank_accounts/${bank_account_number}`).delete();
                            this.bank_embeds(discord_client, msg, `deleting ${name}`);
                            concluded = true;
                            collector.stop();
                            return;

                        }

                        if (name == '') {
                            this.bank_embeds(discord_client, msg, `Provide name of the account you'd like to delete.`);
                            return;
                        }

                        this.bank_embeds(discord_client, msg, `Did not understand, try again.`);
                        return;
                    }

                    action = 'delete';
                    this.bank_embeds(discord_client, msg, `Please provide bank account number for account to delete.`);
                    return;
                }
                else {
                    let bank_menu = new EmbedBuilder()
                        .setTitle('Bank Accounts Menu')
                        .setDescription(`Pick one below.`)
                        .addFields({ name: `> deposit`, value: `Deposit credits to an account.`, inline: false })
                        .addFields({ name: `> withdraw`, value: `Withdraw credits from an account.`, inline: false })
                        .addFields({ name: `> create`, value: `Create an account.`, inline: false })
                        .addFields({ name: `> delete`, value: `Delete an account.`, inline: false })
                        .addFields({ name: `> joint`, value: `Add or Remove someone from your account.`, inline: false })
                        .addFields({ name: `> show`, value: `Show your accounts.`, inline: false })
                        .addFields({ name: `> close`, value: `Close the bank prompt.`, inline: false })
                        .setColor('#ebcf34')
                        .setFooter({ text: `${msg.author.username}` })
                        .setTimestamp();
                    msg.channel.send({ embeds: [bank_menu] });
                    return;
                }
            });
        }
        catch (err) {
            // console.log(err);
        }
    },
    async bank_embeds(discord_client, msg, content) {
        let bank_embed = new EmbedBuilder()
            .setDescription(`${content}`)
            .setColor('#ebcf34')
            .setFooter({ text: `${msg.author.username}` })
            .setTimestamp();
        msg.channel.send({ embeds: [bank_embed] });
        return;
    }
}