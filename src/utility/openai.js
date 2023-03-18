module.exports = {
    async gpt(discord_client, msg) {
        try {
            const axios = require("axios");

            const apiKey = process.env.OPENAI_API_KEY;

            const client = axios.create({
                headers: {
                    Authorization: "Bearer " + apiKey,
                },
            });

            let ref_msg = msg;
            let msg_col = [{ "role": "user", "content": ref_msg.content }];
            while (ref_msg.reference) {
                ref_msg = await msg.channel.messages.fetch(ref_msg.reference?.messageId);
                if (ref_msg.author.id == discord_client.user.id) {
                    msg_col.unshift({ "role": "assistant", "content": ref_msg.content });
                }
                else {
                    msg_col.unshift({ "role": "user", "content": ref_msg.content });
                }
            }
            msg_col.unshift({ "role": "system", "content": "Your name is Beans Bot. You're a helpful assistant in a discord server. This discord has 5 admins: Sore, Frosty, Hydro, Brendan and Zee. Sore made you and is the owner of the server. There are almost 60 other people in the server." })

            const params = {
                model: "gpt-3.5-turbo",
                messages: msg_col,
            };

            client
                .post("https://api.openai.com/v1/chat/completions", params)
                .then((result) => {
                    msg.reply(result.data.choices[0].message.content.trim().substring(0, 2000));
                })
                .catch((err) => {
                    // error
                });
        }
        catch (err) {
            // error
        }
    },
    async davinci(msg) {
        const axios = require("axios");

        const apiKey = process.env.OPENAI_API_KEY;

        const client = axios.create({
            headers: {
                Authorization: "Bearer " + apiKey,
            },
        });

        const params = {
            prompt: msg.content,
            model: "text-davinci-003",
            temperature: 0,
        };

        client
            .post("https://api.openai.com/v1/completions", params)
            .then((result) => {
                msg.channel.send(result.data.choices[0].text);
            })
            .catch((err) => {
                console.log(err);
            });
    }
}