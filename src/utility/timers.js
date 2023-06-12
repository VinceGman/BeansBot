let timer = {};

module.exports = {
    timer(msg, cmd, cooldown_in_seconds) {
        let current_time_in_seconds = Math.floor(Date.now() / 1000);
        let attribute = `${msg.author.id}_${cmd}`;

        if (timer.hasOwnProperty(attribute) && current_time_in_seconds < timer[attribute] + cooldown_in_seconds) {
            msg.channel.send(`${msg.author.username} - ${cmd.charAt(0).toUpperCase() + cmd.slice(1)} Cooldown: <t:${timer[attribute] + cooldown_in_seconds}:R>`);
            return false;
        }

        timer[attribute] = current_time_in_seconds;
        return true;
    }
}