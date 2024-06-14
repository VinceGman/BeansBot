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
    },
    async parse_payment(msg, args) {
        let bet = 1000;
        let bet_type = 'Specified';
        if (args.length != 1) return { bet: bet, bet_type: bet_type };

        let random = false;
        let modifier = 1;

        if (args[0].toLowerCase().startsWith('r')) {
            args[0] = args[0].slice(1, args[0].length);
            random = true;
        }

        if (!isNaN(args[0])) {
            if (+args[0] < 1000) {
                msg.channel.send(`${msg.author.username} - Your bet must be greater than 1000.`);
                return;
            }
            if (args[0].includes('.')) {
                msg.channel.send(`${msg.author.username} - Your number must be whole.`);
                return;
            }
            bet = +args[0];
        }
        else if (['all', 'half', 'third', 'fourth'].includes(args[0].toLowerCase())) {
            switch (args[0].toLowerCase()) {
                case 'all':
                    modifier = 1;
                    break;
                case 'half':
                    modifier = (1 / 2);
                    break;
                case 'third':
                    modifier = (1 / 3);
                    break;
                case 'fourth':
                    modifier = (1 / 4);
                    break;
            }
            bet = +(await require('../utility/queries').user(msg.guildId, msg.author.id)).credits;
        }

        if (modifier != 1) {
            bet_type = 'Mod';
            bet = Math.floor(bet * modifier);
        }

        if (random) {
            bet_type = 'Random';
            bet = Math.floor(Math.random() * bet) + 1;
        }

        return { bet: bet, bet_type: bet_type };
    },
    async parse_user(msg, args, default_to_self = false) {
        if (default_to_self && msg.mentions.users.size == 0) {
            return { recipient: msg.author.id, parsed_args: args };
        }
        if (msg.mentions.users.size != 1) {
            return false;
        }

        let recipient = msg.mentions.users.keys().next().value;
        if (recipient == msg.author.id) {
            return false;
        }

        parsed_args = args.filter(a => !a.includes('<@'));
        return { recipient, parsed_args };
    }
}