module.exports = {
    parse_command(msg, name, aliases = []) { // returns the attributes of a user by id
        let command = msg.content.slice(1).split(/ +/).shift().toLowerCase();

        let cmd_names = aliases.length > 0 ? [name, ...aliases] : [name];

        for (let name of cmd_names) {
            if (command.startsWith(name)) {
                return command.replace(name, '').split('');
            }
        }

        return [];
    }
}