module.exports = {
    async gpt(discord_client, msg) {
        try {
            let { msg_col, users_present } = await this.message_history(msg);

            users_present.push(discord_client.user.id);

            for (let id of users_present) {
                let db_user = await require('../utility/queries').user(id);
                let discord_user = await msg.guild.members.fetch(id);
                if (db_user?.description) {
                    msg_col.unshift({ "role": "system", "content": `Description for ${discord_user.user.username}: ${db_user.description}` });
                }
            }

            // set up the axios client auth
            const axios_client = require("axios").create({ headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY } });
            // get result from ai engine
            let result = await axios_client.post("https://api.openai.com/v1/chat/completions", { model: "gpt-3.5-turbo", messages: msg_col });
            // await reply to discord to verify no errors
            await msg.reply(result.data.choices[0].message.content.trim().substring(0, 2000));
        }
        catch (err) {
            msg.reply(`Request could not be completed due to an error. -> ${err.message}`);
        }
    },
    async message_history(msg) {
        let initial = true;
        let msg_col = [], users_present = [];
        do {
            ref_msg = initial ? msg : await msg.channel.messages.fetch(ref_msg.reference?.messageId);
            initial = false;

            if (ref_msg.author.username == "Beans") {
                msg_col.unshift({ "role": "assistant", "content": ref_msg.content });
            }
            else {
                msg_col.unshift({ "role": "user", "content": `${ref_msg.author.username}: ${ref_msg.content}` });
                if (!users_present.includes(ref_msg.author.id)) users_present.push(ref_msg.author.id);
            }
        } while (ref_msg.reference);

        return { msg_col, users_present };
    }
}

/*
    async davinci(msg) {
        const axios = require("axios");

        const apiKey = process.env.OPENAI_API_KEY;

        const axios_client = axios.create({
            headers: {
                Authorization: "Bearer " + apiKey,
            },
        });

        const params = {
            prompt: msg.content,
            model: "text-davinci-003",
            temperature: 0,
        };

        axios_client.post("https://api.openai.com/v1/completions", params)
            .then((result) => {
                msg.channel.send(result.data.choices[0].text);
            })
            .catch((err) => {
                console.log(err);
            });
    }
*/