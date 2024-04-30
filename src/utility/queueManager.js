// queueManager.js
const queue = new Map();

module.exports = {
    getQueue: (guildId) => queue.get(guildId),
    setQueue: (guildId, queueConstruct) => queue.set(guildId, queueConstruct),
    deleteQueue: (guildId) => queue.delete(guildId),
    hasQueue: (guildId) => queue.has(guildId)
};