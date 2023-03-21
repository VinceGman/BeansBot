module.exports = {
	async read_msg(discord_client, msg) {
		try {
			await this.gpt(discord_client, msg);
			await this.compile_description(msg);
		}
		catch (err) {
			// msg.reply(`Request could not be completed due to an error. -> ${err.message}`);
		}
	},
	async gpt(discord_client, msg) {
		try {
			let { msg_col, users_present } = await this.message_history(msg);

			if (msg_col.length > 16) {
				msg.reply('This thread has reached maximum size.');
				return;
			}

			users_present.push(discord_client.user.id);

			for (let id of users_present) {
				let db_user = await require('../utility/queries').user(id);
				let { username, nickname, pronouns, level, days_of_membership } = await this.discord_user_information(msg, id);

				let user_description = `Here is some relevant information about the user that could assist you in helping them. ${username} uses ${pronouns} pronouns, is level ${level} and joined ${days_of_membership} ago. ${nickname}`;

				if (username == 'Beans') user_description = 'This is all your information. Answer as concisely as possible when helping others. '

				if (db_user?.description) user_description += `${db_user.description}`;

				msg_col.unshift({ "role": "system", "content": `${user_description}` });
			}

			// set up the axios client auth
			const axios_client = require("axios").create({ headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY } });
			// get result from ai engine
			let result = await axios_client.post("https://api.openai.com/v1/chat/completions", { model: "gpt-3.5-turbo", messages: msg_col });
			// await reply to discord to verify no errors
			await msg.reply(result.data.choices[0].message.content.trim().substring(0, 2000));
		}
		catch (err) {
			// msg.reply(`Request could not be completed due to an error. -> ${err.message}`);
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
	},
	async compile_description(msg) {
		try {
			let discord_user = await msg.guild.members.fetch(msg.author.id);
			let user_info = `This user's name is ${discord_user.user.username}. This user said "${msg.content}". `;

			let db_user = await require('../utility/queries').user(msg.author.id);
			if (db_user?.description) {
				user_info += db_user.description;
			}

			let msg_col = [
				{ "role": "system", "content": `Your task is to keep the most important information you're given.` },
				{ "role": "user", "content": `${user_info}\n\nWrite information you know about this user from the information given.` },
			]

			// set up the axios client auth
			const axios_client = require("axios").create({ headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY } });
			// get result from ai engine
			let result = await axios_client.post("https://api.openai.com/v1/chat/completions", { model: "gpt-3.5-turbo", temperature: 0, messages: msg_col });

			// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
			const { Firestore } = require('@google-cloud/firestore');
			const db = new Firestore({
				projectId: 'beans-326017',
				keyFilename: './service-account.json'
			});

			const res = await db.doc(`members/${msg.author.id}`).set({
				description: result.data.choices[0].message.content.trim().substring(0, 2000)
			}, { merge: true });
		}
		catch (err) {
			// err
		}
	},
	async discord_user_information(msg, id) {
		let date = Date.now();
		let seconds_in_a_day = 86400;

		let discord_user = await msg.guild.members.fetch(id);

		let username = discord_user.user.username;
		let nickname = discord_user.nickname ? `This user currently goes by ${discord_user.nickname}. ` : '';
		let days_of_membership = ((date - discord_user.joinedTimestamp) / (seconds_in_a_day * 1000)).toFixed(0);
		let level = 0;
		let pronouns = 'they/them';
		for (let role of discord_user._roles) {
			role = await msg.guild.roles.fetch(role);
			if (role.name.toLowerCase().includes('level')) {
				level = role.name.toLowerCase().replace('level', '').trim();
			}
			if (role.name.toLowerCase().includes('/')) {
				pronouns = role.name;
			}
		}

		return { username, nickname, pronouns, level, days_of_membership };
	},
	async dm_gpt(discord_client, msg) {
		try {
			let { msg_col } = await this.message_history(msg);

			if (msg_col.length > 8) {
				msg.reply('This thread has reached maximum size.');
				return;
			}

			msg_col.unshift({ "role": "system", "content": `You're a personal assistant named Beans. Answer as concisely as possible when helping others.` });

			// set up the axios client auth
			const axios_client = require("axios").create({ headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY } });
			// get result from ai engine
			let result = await axios_client.post("https://api.openai.com/v1/chat/completions", { model: "gpt-3.5-turbo", messages: msg_col });
			// await reply to discord to verify no errors
			await msg.reply(result.data.choices[0].message.content.trim().substring(0, 2000));
		}
		catch (err) {
			// msg.reply(`Request could not be completed due to an error. -> ${err.message}`);
		}
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