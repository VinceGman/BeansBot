module.exports = {
    async gpt(msg) {
        try {
            const axios = require("axios");

            const apiKey = process.env.OPENAI_API_KEY;

            const client = axios.create({
                headers: {
                    Authorization: "Bearer " + apiKey,
                },
            });

            const params = {
                model: "gpt-3.5-turbo",
                messages: [
                    { "role": "system", "content": "Your name is Beans Bot. You're a helpful assistant in a discord server run by Sore, Frosty, Hydro, Brendan and Zee. Sore made you." },
                    { "role": "user", "content": msg.content },
                ]
            };

            client
                .post("https://api.openai.com/v1/chat/completions", params)
                .then((result) => {
                    msg.channel.send(result.data.choices[0].message.content.trim().substring(0, 2000));
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