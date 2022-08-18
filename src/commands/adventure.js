require('dotenv').config(); // .env values
const { MessageEmbed } = require('discord.js');
const adventure = require("adventurejs");


module.exports = {
    name: 'adventure',
    description: "text adventure game",
    admin: true,
    type: "production",
    game: false,
    active_service: true,
    async execute(discord_client, msg) {
        if (!this.active_service) {
            msg.channel.send("Adventure is currently down for maintenance.")
            return;
        }

        if (msg.content.startsWith('ooc') || msg.content.startsWith('-') || (msg.content.startsWith('(') && msg.content.endsWith(')')) || msg.content.startsWith('>') || msg.content.startsWith('/') || (msg.content.startsWith('"') && msg.content.endsWith('"'))) {
            return;
        }

        if (!this.game) {
            this.game = adventure.makeState();
        }

        if (msg.content.toLowerCase() == 'start') {
            if (this.game.isDone()) {
                this.game = adventure.makeState();
            }
        }

        let in_text = msg.content == 'null' ? '-' : msg.content;
        let out_text_array = this.game.advance(in_text);
        let out_text = out_text_array.join('\n');

        if (out_text == '') {
            if (this.game.isDone()) {
                msg.channel.send(`\`\`\`say 'start' to play\`\`\``);
            }
            return;
        }

        msg.channel.send(`\`\`\`${out_text}\`\`\``);
    },
    async service_toggle() {
        this.active_service = !this.active_service;
    }
}