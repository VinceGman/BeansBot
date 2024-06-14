module.exports = {
    channels: ['1184186351260794880'],
    async channel_function(discord_client, msg, run_type) {
        try {
            switch (msg.channel.id) {
                case '1184186351260794880': // main-server // counting
                    if (run_type != 'production') return;

                    let date_bonus = (new Date()).getDate() == 1 || (new Date()).getDate() == 15 ? 5 : 1;
                    await new Promise(r => setTimeout(r, 3000));

                    let count_verification = false;
                    for (let reaction of msg.reactions.cache) {
                        if (!(await reaction[1].users.fetch()).has('510016054391734273')) continue; // only executes counting bot reactions

                        if (['❌'].includes(reaction[0])) {
                            // fines
                            return;
                        }
                        else if (['✅', '☑️', '💯'].includes(reaction[0])) {
                            count_verification = true;
                        }
                    }

                    if (!count_verification) return;

                    let number = msg.content.split(' ').length > 1 ? +msg.content.split(' ')[0] : +msg.content;
                    let booster_bonus = msg.member.roles.cache.some(role => role.name.toLowerCase().includes('booster')) ? 1.5 : 1;
                    if (!isNaN(number)) await require('../utility/credits').refund(discord_client, msg, msg.author.id, number * booster_bonus * date_bonus); // credits manager refunds credits
                    break;
            }
        }
        catch (err) {
            // error
        }
    }

}
