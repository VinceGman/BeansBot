// volume.js
const { getQueue } = require('../utility/queueManager');

module.exports = {
    name: 'volume',
    description: "Adjusts the playback volume.",
    category: 'music',
    admin: false,
    type: "production",
    cooldown: 4,
    execute(discord_client, msg, args, admin) {
        const serverQueue = getQueue(msg.guild.id);
        if (!serverQueue || !serverQueue.connection) {
            return msg.channel.send("There is no song currently playing!");
        }

        const volume = parseInt(args[0]);
        if (!volume || isNaN(volume) || volume < 0 || volume > 100) {
            return msg.channel.send("Please enter a valid number between 0 and 100 for volume.");
        }

        if (serverQueue.connection.state.status === 'ready' && serverQueue.connection.state.subscription) {
            const player = serverQueue.connection.state.subscription.player;
            if (player.state.status === 'playing' && player.state.resource) {
                player.state.resource.volume.setVolumeLogarithmic(volume / 100);
                serverQueue.volume = volume;
                msg.channel.send(`Volume set to: **${volume}**`);
            } else {
                msg.channel.send("No active audio resource to adjust volume.");
            }
        } else {
            msg.channel.send("The bot is not currently connected to the voice channel properly.");
        }
    }
};
