let trigger = "baka";
let response = "https://i.pinimg.com/originals/71/26/88/712688c97dee1eff13c746a181982fba.jpg";

module.exports = {
    name: 'zee',
    description: "zee's girlboss reply",
    admin: true,
    type: "final",
    execute(message, args, admin, call) {
        const index = require('../index.js').execute();
        if (index.run_type != this.type) return;
        if (call) {
            if (!message.content.toLowerCase().includes(trigger)) return;
            if (response != null && response != "") {
                message.channel.send(response);
            }
            else {
                message.channel.send("This command will break the bot. Please use it carefully.");
            }
        }
        else { 
            if (message.author.id == '201771967202852865') {
                if (args.length <= 2 || !args.includes('|')) {
                    message.channel.send(`+zee trigger | response\n\nTrigger: "${trigger}"\nResponse: "<${response}>"`);
                    return;
                }
                args = args.join(' ').split(' | ');
                trigger = args[0].toLowerCase() || "trigger didn't work";
                response = args[1] || "response didn't work";
                message.channel.send(`Trigger: "${trigger}" | Response: "<${response}>"`);
            }
            else {
                message.channel.send('This is only for Zee.');
                return;
            }
        }
    }
}