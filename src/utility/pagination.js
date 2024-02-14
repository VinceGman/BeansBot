// https://github.com/saanuregh/discord.js-pagination/blob/master/index.js
/*
This comes from 'discord.js-pagination@msg' npm package but it wasn't working. 
I fixed it here so I could use it as a utility. I also want to expand on it.
*/

module.exports = {
    async paginationEmbed(msg, pages, emojiList = ['⏪', '⏩'], timeout = 120000) {
        if (pages.length == 0) {
            return;
        }
        else if (pages.length == 1) {
            msg.channel.send({ embeds: [pages[0]] });
            return;
        }
        let page = 0;
        const curPage = await msg.channel.send({ embeds: [pages[page]] });
        for (const emoji of emojiList) await curPage.react(emoji);
        const reactionCollector = curPage.createReactionCollector({ filter: (reaction, user) => emojiList.includes(reaction.emoji.name) && !user.bot && user.id != curPage.author.id, time: timeout });

        reactionCollector.on('collect', (reaction, user) => {
            if (user.id == curPage.author.id) return;
            reaction.users.remove(msg.author);
            reactionCollector.resetTimer({ time: timeout });
            switch (reaction.emoji.name) {
                case emojiList[0]:
                    page = page > 0 ? --page : pages.length - 1;
                    break;
                case emojiList[1]:
                    page = page + 1 < pages.length ? ++page : 0;
                    break;
                default:
            }
            curPage.edit({ embeds: [pages[page]] });
        });

        reactionCollector.on('end', () => {
            if (!curPage.deleted) {
                curPage.reactions.removeAll()
            }
        });
        return curPage;
    }
}