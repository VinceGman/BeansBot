module.exports = {
	async distributor(discord_client, msg) {
		try {
			if (msg.content.toLowerCase().startsWith('dahlia')) {
				await this.dahlia(discord_client, msg);
				return;
			}
			// if (msg.content.toLowerCase().startsWith('beans')) {
			await this.beans(discord_client, msg);
			await this.compile_description(msg);
			return;
			// }
			// if (msg.content.toLowerCase().startsWith('luna')) {
			// 	await this.luna(discord_client, msg);
			// 	await this.compile_description(msg);
			// 	return;
			// }
			// if (msg.content.toLowerCase().startsWith('niko')) {
			// 	await this.niko(discord_client, msg);
			// 	await this.compile_description(msg);
			// 	return;
			// }
		}
		catch (err) {
			// msg.reply(`Request could not be completed due to an error. -> ${err.message}`);
		}
	},
	async beans(discord_client, msg) {
		try {
			if (!(await require('../utility/tokens').verify_tokens(discord_client, msg))) return;

			let { msg_col, users_present } = await this.message_history(msg);

			if (msg_col.length > 16) {
				msg.reply('This thread has reached maximum size.');
				return;
			}

			for (let id of users_present) {
				let db_user = await require('../utility/queries').user(id);
				let { username, nickname, pronouns, level, days_of_membership } = await this.discord_user_information(msg, id);
				let user_description = `Here is some relevant information about the user that could assist you in helping them. ${username} uses ${pronouns} pronouns, is level ${level} and joined ${days_of_membership} ago. ${nickname}`;
				if (db_user?.description) user_description += `${db_user.description}`;
				msg_col.unshift({ "role": "system", "content": `${user_description}` });
			}

			// let member_list = await this.get_member_list(msg);

			// adding the bot information to system content
			let db_beans_bot = await require('../utility/queries').user(discord_client.user.id);
			let beans_bot_description = db_beans_bot?.description ? `${db_beans_bot.description}` : `Your name is Beans. You're a helpful assistant in a discord server.`;
			msg_col.unshift({ "role": "system", "content": `${beans_bot_description} Answer as concisely as possible when helping others.` });


			// set up the axios client auth
			const axios_client = require("axios").create({ headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY } });
			// get result from ai engine
			let result = await axios_client.post("https://api.openai.com/v1/chat/completions", { model: "gpt-3.5-turbo", messages: msg_col });
			// await reply to discord to verify no errors
			await msg.reply(`${result.data.choices[0].message.content.trim().substring(0, 2000)}`); // \n\n${result.data.usage.total_tokens} = ${result.data.usage.prompt_tokens} + ${result.data.usage.completion_tokens}`);

			await require('../utility/tokens').transaction(discord_client, msg, result.data.usage.total_tokens);
		}
		catch (err) {
			// msg.reply(`Request could not be completed due to an error. -> ${err.message}`);
			console.log(err);
		}
	},
	async niko(discord_client, msg) {
		try {
			if (!(await require('../utility/tokens').verify_tokens(discord_client, msg))) return;

			let { msg_col, users_present } = await this.message_history(msg);

			if (msg_col.length > 16) {
				msg.reply('This thread has reached maximum size.');
				return;
			}

			for (let id of users_present) {
				let db_user = await require('../utility/queries').user(id);
				let { username, nickname, pronouns, days_of_membership } = await this.discord_user_information(msg, id);
				let user_description = `Here is some relevant information about the user that could assist you in helping them. ${username} uses ${pronouns} pronouns and joined ${days_of_membership} days ago. ${nickname}`;
				if (db_user?.description) user_description += `${db_user.description}`;
				msg_col.unshift({ "role": "system", "content": `${user_description}` });
			}

			// let member_list = await this.get_member_list(msg);

			msg_col.unshift({ "role": "system", "content": `Your name is Niko. You are Niko. All you do is play pretend and be fun. You love to play pretend and make jokes. You're jovial and eccentric. Keep answers within 2000 characters.` });

			// set up the axios client auth
			const axios_client = require("axios").create({ headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY } });
			// get result from ai engine
			let result = await axios_client.post("https://api.openai.com/v1/chat/completions", { model: "gpt-3.5-turbo", messages: msg_col, temperature: 1.6 });
			// await reply to discord to verify no errors
			await msg.reply(`${result.data.choices[0].message.content.trim().substring(0, 2000)}`); // \n\n${result.data.usage.total_tokens} = ${result.data.usage.prompt_tokens} + ${result.data.usage.completion_tokens}`);

			await require('../utility/tokens').transaction(discord_client, msg, result.data.usage.total_tokens);
		}
		catch (err) {
			// msg.reply(`Request could not be completed due to an error. -> ${err.message}`);
			console.log(err);
		}
	},
	async luna(discord_client, msg) {
		try {
			if (!(await require('../utility/tokens').verify_tokens(discord_client, msg))) return;

			let { msg_col, users_present } = await this.message_history(msg);

			if (msg_col.length > 16) {
				msg.reply('This thread has reached maximum size.');
				return;
			}

			msg_col.unshift({ "role": "system", "content": `Your name is Luna. You're a logical and helpful assistant. Answer as concisely as possible when helping others.` });

			console.log(msg_col);

			// set up the axios client auth
			const axios_client = require("axios").create({ headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY } });
			// get result from ai engine
			let result = await axios_client.post("https://api.openai.com/v1/chat/completions", { model: "gpt-4", messages: msg_col });
			// await reply to discord to verify no errors
			await msg.reply(`${result.data.choices[0].message.content.trim().substring(0, 2000)}`); // \n\n${result.data.usage.total_tokens} = ${result.data.usage.prompt_tokens} + ${result.data.usage.completion_tokens}`);

			await require('../utility/tokens').transaction(discord_client, msg, result.data.usage.total_tokens * 30);
		}
		catch (err) {
			// msg.reply(`Request could not be completed due to an error. -> ${err.message}`);
			console.log(err);
		}
	},
	async dahlia(discord_client, msg) {
		try {
			if (!(await require('../utility/tokens').verify_tokens(discord_client, msg))) return;
			let prompt = msg.content.split(' ').slice(1).join(' ');

			// set up the axios client auth
			const axios_client = require("axios").create({ headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY } });
			// get result from ai engine
			let result = await axios_client.post("https://api.openai.com/v1/images/generations", { prompt: prompt, n: 1, size: '1024x1024' });
			// await reply to discord to verify no errors
			await msg.reply(result.data.data[0].url);

			await require('../utility/tokens').transaction(discord_client, msg, 10000);
		}
		catch (err) {
			msg.reply('This request could not be completed.');
		}
	},
	async message_history(msg) {
		let initial = true;
		let msg_col = [], users_present = [];
		do {
			ref_msg = initial ? msg : await msg.channel.messages.fetch(ref_msg.reference?.messageId);
			initial = false;

			let msg_content = ref_msg.content.split(' ');
			if (ref_msg.mentions.users.size > 0) {
				for (let arg in msg_content) {
					if (msg_content[arg].startsWith('<@') && msg_content[arg].endsWith('>')) {
						if (!users_present.includes(ref_msg.author.id)) users_present.push(msg_content[arg].replace('<@', '').replace('>', ''));
					
						let user = await msg.guild.members.fetch(msg_content[arg].replace('<@', '').replace('>', ''))
						msg_content[arg] = user.user.username;
						
					}
				}
			}

			msg_content = msg_content.join(' ');

			if (ref_msg.author.username == "Beans") {
				msg_col.unshift({ "role": "assistant", "content": msg_content });
			}
			else {
				msg_col.unshift({ "role": "user", "content": `${ref_msg.author.username}: ${msg_content}` });
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
		let pronouns = 'they/them';
		for (let role of discord_user._roles) {
			role = await msg.guild.roles.fetch(role);
			if (role.name.toLowerCase().includes('/')) {
				pronouns = role.name;
			}
		}

		return { username, nickname, pronouns, days_of_membership };
	},
	async get_member_list(msg) {
		let members = await msg.guild.members.fetch();

		let date = Date.now();
		let seconds_in_a_day = 86400;

		let count = 0;
		let member_list = '';
		for (let member of members) {
			member = member[1];
			if (member.user.bot) continue;
			count++;

			let days_of_membership = ((date - member.joinedTimestamp) / (seconds_in_a_day * 1000)).toFixed(0);
			let level = 0;
			for (let role of member._roles) {
				role = await msg.guild.roles.fetch(role);
				if (!role.name.toLowerCase().includes('level')) continue;
				level = role.name.toLowerCase().replace('level', '').trim();
			}

			member_list += `${member.user.username}, ${member.nickname ? member.nickname : 'N/A'}, ${pronouns}, ${level}, ${days_of_membership}, [${roles}]`;
		}
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