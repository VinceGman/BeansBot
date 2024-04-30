// dc.js
const { getQueue, deleteQueue } = require('../utility/queueManager');

module.exports = {
    name: 'disconnect',
    alias: ['dc'],
    description: "Disconnects the bot from the voice channel and clears the queue.",
    category: 'music',
    admin: false,
    type: "production",
    cooldown: 4,
    execute(discord_client, msg, args) {
        const serverQueue = getQueue(msg.guild.id);
        if (!serverQueue) {
            return msg.channel.send("I'm not currently connected to any voice channel!");
        }
        
        if (serverQueue.connection) {
            serverQueue.connection.destroy(); // Disconnects the bot from the voice channel
        }
        
        deleteQueue(msg.guild.id); // Clear the music queue
        msg.channel.send("Disconnected from the voice channel and cleared the queue.");
    }
};
