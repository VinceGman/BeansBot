const fs = require('fs');
require('dotenv').config(); // .env values

require('lodash.permutations');
let _ = require('lodash');

// dashboard: https://console.cloud.google.com/firestore/data?project=beans-326017
const { Firestore, FieldValue, addDoc } = require('@google-cloud/firestore');
const db = new Firestore({
	projectId: 'beans-326017',
	keyFilename: './service-account.json'
});

const { Client, Collection, EmbedBuilder } = require('discord.js');
const discord_client = new Client({ intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'DirectMessages', 'GuildMessageReactions', 'MessageContent'], partials: ['Message', 'Channel', 'GuildMember'] });

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

const { CronJob } = require('cron');

// every second * * * * * *
// every minute * * * * *
// every hour   0 * * * *
const job = new CronJob(
	'0 * * * *', // cronTime
	async function () {
		let socks = (await db.doc(`values/socks`).get()).data() ?? {};
		socks.run = socks.run == null ? false : socks.run;
		if (socks.run) {
			console.log(`${new Date().getTime() / 1000} - ${socks.run}`);
		}
	}, // onTick
	null, // onComplete
	true, // start
	'America/Los_Angeles' // timeZone
);

discord_client.on('ready', async () => {
	// discord_client.user.setActivity('+income', { type: 'CUSTOM' });

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

let channel_utilities = require('../utility/channels');

discord_client.on('messageCreate', async msg => {
	if (msg.author.bot) return;
	if (msg.guildId === null) return;


	if (channel_utilities.channels.includes(msg.channel.id)) {
		channel_utilities.channel_function(discord_client, msg, run_type);
	}
	else if (msg.content.startsWith(prefix)) {
		const args = msg.content.replaceAll(',', '').slice(prefix.length).split(/ +/);
		const command = args.shift().toLowerCase();

		for (let i = 0; i < args.length; i++) {
			if (['name', 'status'].includes(args[i].replace(':', ''))) break;
			let arg = args[i];

			let set_prefix = '';
			let prefixes = ['rand', 'ran', 'r'];
			for (let pf of prefixes) {
				if (arg.toLowerCase().startsWith(pf)) {
					set_prefix = pf;
					arg = arg.slice(pf.length, arg.length);
					break;
				}
			}

			let postfixes = ['k', 'mill', 'mil', 'm'];
			for (let pf of postfixes) {
				let modifier = pf == 'k' ? 1000 : 1000000;
				if (arg.toLowerCase().endsWith(pf)) {
					if (!isNaN(arg.slice(0, -pf.length))) {
						arg = (+arg.slice(0, -pf.length) * modifier).toString();
					}
					break;
				}
			}

			args[i] = set_prefix + arg;
		}

		let admin = false;
		let execute = false;

		// msg.author.id == '427677302608887810' || msg.author.id == '183019001058689025'
		// msg.member.roles.cache.some(role => role.name.toLowerCase() === 'admins' || role.name.toLowerCase() === 'mods')
		try {
			if (discord_client.commands.get(command).type != run_type) return;
			if (msg.author.id == '427677302608887810' || msg.author.id == '183019001058689025') admin = true;

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

			if (run_type == 'production' && (msg.channel.name.includes('commands') || msg.content.toLowerCase().includes('translate') || msg.guildId == '1023285041847087226') && (msg.content.toLowerCase().startsWith('dahlia') || msg.content.toLowerCase().startsWith('beans') || msg.content.toLowerCase().startsWith('buttercup') || msg.mentions.users.has(discord_client.user.id) || reply)) {
				await require('../utility/openai').distributor(discord_client, msg);
			}
		}
		catch (err) {
			// error
		}
	}
});

discord_client.on('guildMemberUpdate', async (oldMember, newMember) => {
	if (run_type != 'test') return;

	const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
	if (addedRoles.size > 0 && [...addedRoles.values()].some((value) => value.name.toLowerCase().includes('flag:'))) {
		console.log(result);
	}
});

discord_client.login(process.env.discord_token);

module.exports = discord_client;