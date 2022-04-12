const { MessageCollector } = require("discord.js");

module.exports = {
    name: 'date',
    description: "date <user>",
    admin: false,
    type: "test",
    execute(message, args, admin) {
        message.channel.send(`**Command Not Set Up** - Description: *${this.description}*`);
        // if (args > 1 || args <= 0 || message.mentions.everyone) {
        //     message.channel.send("+date <@user>");
        // } else {
        //     try {
        //         message.mentions.users.forEach((e) => { args = id });
        //         const filter = (m) => m.author.id === message.author.id;

        //         const collector = new MessageCollector(message.channel, filter, { time: 25000 });

        //         collector.on("collect", (msg) => {
        //             msg.channel.send(msg.content);
        //             if (msg.content.toLowerCase() === "yes") { //collector.stop();
        //                 collector.stop();
        //             } else if (msg.content.toLowerCase() == "no") {
        //                 collector.stop();
        //             }
        //         });

        //         collector.on("end", (collected) => {
        //             message.channel.send(`${collected.size} messages were sent!`);
        //             //console.log(collected);
        //             //message.channel.send("collector stopped");
        //         });
        //     } catch (e) {
        //         message.channel.send("that shit didn't work")
        //     }
        // }
    }
}



// const filter = (m) => m.author.id === message.author.id;

// const collector = new MessageCollector(message.channel, filter, { time: 25000 });

// collector.on("collect", (msg) => {
//     msg.channel.send(msg.content);
//     if (msg.content.toLowerCase() === "yes") { //collector.stop();
//         collector.stop();
//     } else if (msg.content.toLowerCase() == "no") {
//         collector.stop();
//     }
// });

// collector.on("end", (collected) => {
//     message.channel.send(`${collected.size} messages were sent!`);
//     //console.log(collected);
//     //message.channel.send("collector stopped");
// });

/*

*/