const { getQueue } = require('../utility/queueManager');

module.exports = {
    name: 'skip',
    description: "Skips the current song and plays the next one in the queue.",
    category: 'music',
    admin: false,
    type: "production",
    cooldown: 4,
    execute(discord_client, msg, args, admin) {
        const serverQueue = getQueue(msg.guild.id);
        if (!serverQueue) {
            return msg.channel.send("There is no song currently playing to skip!");
        }
        if (!msg.member.voice.channel) {
            return msg.channel.send("You need to be in a voice channel to skip a song!");
        }
        if (serverQueue.songs.length <= 1) {
            return msg.channel.send("There is no next song in the queue.");
        }

        // Correctly stop the currently playing audio using the player
        if (serverQueue.connection && serverQueue.connection.state.status === 'ready' && serverQueue.connection.state.subscription) {
            serverQueue.connection.state.subscription.player.stop();
            msg.channel.send("Skipping to the next song...");
        } else {
            msg.channel.send("There was an error trying to skip the song.");
        }
    }
};
