const fs = require('fs');
require('dotenv').config(); // .env values

require('lodash.permutations');
let _ = require('lodash');

const { Client, Collection, EmbedBuilder } = require('discord.js');
const discord_client = new Client({ intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'DirectMessages', 'GuildMessageReactions', 'MessageContent'], partials: ['Message', 'Channel'] });

let prefix = '+';
let run_type = 'production';

discord_client.commands = new Collection();
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`../commands/${file}`);

	let poss_cmd_names = command.hasOwnProperty('alias') ? [command.name, ...command.alias] : [command.name];
	let poss_cmd_options = command.hasOwnProperty('options') ? [[], ..._.flatMap(command.options, (v, i, a) => _.permutations(a, i + 1))] : [[]];

	for (let name of poss_cmd_names) {
		for (let option of poss_cmd_options) {
			discord_client.commands.set(name + option.join(''), command);
		}
	}
}

discord_client.on('ready', async () => {
	discord_client.user.setActivity("with Code", { type: 'PLAYING' });

	if (process.env.USERDOMAIN == 'CYBER') {
		run_type = 'test';
	}
	else {
		const bot_log = discord_client.channels.cache.get(process.env.discord_bot_log_id);
		bot_log.send({
			embeds:
				[new EmbedBuilder()
					.setColor(`#000000`)
					.setTitle(`System Restart`)
					.setDescription(`run_env: **${run_type}**`)
					.setFooter({ text: `Beans Staff Message` })
					.setTimestamp()]
		});
	}
});

discord_client.on('messageCreate', async msg => {
	if (msg.author.bot) return;

	if (msg.guildId === null) {
		try {
			if (run_type == 'production') {
				await require('../utility/openai').dm_gpt(discord_client, msg);
			}
		}
		catch (err) {
			// err
		}
		return;
	}
	else if (msg.content.startsWith(prefix)) {
		const args = msg.content.slice(prefix.length).split(/ +/);
		const command = args.shift().toLowerCase();

		let admin = false;
		let execute = false;

		try {
			if (discord_client.commands.get(command).type != run_type) return;
			if (msg.member.roles.cache.some(role => role.name.toLowerCase() === 'admins' || role.name.toLowerCase() === 'mods' || role.name.toLowerCase() === 'pilot')) admin = true;

			for (let scope of discord_client.commands.get(command).scopes ?? ['commands']) {
				if (scope == 'commands' && msg.channel.name.includes('command')) execute = true;
				if (scope == 'global') execute = true;
				if (msg.channel.id == scope) execute = true;
			}

			if (!execute) return;
			discord_client.commands.get(command).execute(discord_client, msg, args, admin);
		}
		catch (err) {
			// console.error(err);
		}
	}
	else {
		try {
			let reply = false;
			if (msg.reference) {
				let ref_msg = await msg.channel.messages.fetch(msg.reference?.messageId);
				if (ref_msg.author.id == discord_client.user.id) {
					reply = true;
				}
			}

			if (run_type == 'production' && msg.channel.name.includes('commands') && (msg.content.toLowerCase().startsWith('dahlia') || msg.content.toLowerCase().startsWith('beans') || msg.mentions.users.has(discord_client.user.id) || reply)) {
				await require('../utility/openai').distributor(discord_client, msg);
			}
		}
		catch (err) {
			// error
		}
	}
});

discord_client.login(process.env.discord_token);

module.exports = discord_client;