let trigger = "L";
let response = "L + Bozo + Ratio";

module.exports = {
    name: 'hydro',
    description: "hydro's based reply",
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
            if (message.author.id == '140544571045183488' || message.author.id == '916980376830894081') {
                if (args.length <= 2 || !args.includes('|')) {
                    message.channel.send(`+hydro trigger | response\n\nTrigger: "${trigger}"\nResponse: "<${response}>"`);
                    return;
                }
                args = args.join(' ').split(' | ');
                trigger = args[0].toLowerCase() || "trigger didn't work";
                response = args[1] || "response didn't work";
                message.channel.send(`Trigger: "${trigger}" | Response: "<${response}>"`);
            }
            else {
                message.channel.send('This is only for Hydro.');
                return;
            }
        }
    }
}