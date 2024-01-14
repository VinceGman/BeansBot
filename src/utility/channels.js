module.exports = {
    channels: ['1184186351260794880'],
    async channel_function(discord_client, msg, run_type) {
        try {
            switch (msg.channel.id) {
                case '1184186351260794880': // main-server // counting
                    if (run_type != 'production') return;
                    await new Promise(r => setTimeout(r, 3000));

                    let count_verification = false;
                    for (let reaction of msg.reactions.cache) {
                        if (['✅', '☑️', '💯'].includes(reaction[0])) {
                            count_verification = true;
                        }
                    }

                    if (!count_verification) return;

                    let number = msg.content.split(' ').length > 1 ? +msg.content.split(' ')[0] : +msg.content;
                    let booster_bonus = msg.member.roles.cache.some(role => role.name.toLowerCase().includes('booster')) ? 1.5 : 1;
                    if (!isNaN(number)) await require('../utility/credits').refund(discord_client, msg.author.id, number * booster_bonus); // credits manager refunds credits

                    break;
            }
        }
        catch (err) {
            // error
        }
    }

}
