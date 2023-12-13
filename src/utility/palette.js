module.exports = {
    async palette(discord_client, server_id) {
        try {
            let server = (await discord_client.guilds.fetch(server_id))
            let colors = { name: server.name, count: 0, colors: [] };
            let roles = (await server.roles.fetch());

            for (let role of roles) {
                if (role[1].name.toLowerCase().includes('color: ')) {
                    colors.colors.push({ color: `#${role[1].color.toString(16).padStart(6, '0').toUpperCase()}`, name: role[1].name.replace('Color: ', '').replace('color: ', '') });
                    colors.count++;
                }
            }

            let colorSort = require('color-sorter')
            let sorted = colors.colors.map(c => c.color).sort(colorSort.sortFn)

            let sorted_colors = [];
            for (let sorted_col of sorted) {
                for (let col of colors.colors) {
                    if (sorted_col == col.color) {
                        sorted_colors.push(col);
                    }
                }
            }

            colors.colors = [...sorted_colors];

            return colors;
        }
        catch (err) {
            return { count: 0, colors: [] };
        }
    }
}