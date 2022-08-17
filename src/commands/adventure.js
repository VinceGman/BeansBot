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

        if (!this.game) {
            this.game = adventure.makeState();
        }

        if (msg.content == 'start' || msg.content == 'Start') {
            if (this.game.isDone()) {
                this.game = adventure.makeState();
            }
        }

        let in_text = msg.content == 'null' ? '-' : msg.content;
        let out_text_array = this.game.advance(in_text);
        let out_text = out_text_array.join('\n');

        msg.channel.send(`\`\`\`${out_text}\`\`\``);
    },
    async service_toggle() {
        this.active_service = !this.active_service;
    }
}