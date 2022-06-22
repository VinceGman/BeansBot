////////////////// guild member updated //////////////////

// discord_client.on("guildMemberUpdate", function (oldMember, newMember) {
//     let memberChanges = detailedDiff(oldMember, newMember)

//     console.log(memberChanges);

//     let change = 'unassigned';
//     if (memberChanges.updated.hasOwnProperty('communicationDisabledUntilTimestamp')) {
//         change = memberChanges.updated.communicationDisabledUntilTimestamp != null ? 'timeout' : 'timeout_removed';
//     } else if (memberChanges.updated.hasOwnProperty('_roles')) {
//         change = 'roles';
//     }

//     let bot_log = newMember.guild.channels.cache.get(process.env.discord_bot_log_id);

//     switch (change) {
//         case 'timeout':
//             bot_log.send(`${newMember.user.username}#${newMember.user.discriminator} is timed out.`);
//             break;
//         case 'timeout_removed':
//             bot_log.send(`${newMember.user.username}#${newMember.user.discriminator} is no longer timed out.`);
//             break;
//         case 'roles':
//             bot_log.send(`${newMember.user.username}#${newMember.user.discriminator} roles updated.`);
//             break;
//         default:
//             console.log(change);
//     }
// });

////////////////// guild member updated //////////////////

// actions: ActionsManager {
//     client: [Circular *1],
//     ChannelCreate: ChannelCreateAction { client: [Circular *1] },
//     ChannelDelete: ChannelDeleteAction { client: [Circular *1], deleted: Map(0) {} },
//     ChannelUpdate: ChannelUpdateAction { client: [Circular *1] },
//     GuildBanAdd: GuildBanAdd { client: [Circular *1] },
//     GuildBanRemove: GuildBanRemove { client: [Circular *1] },
//     GuildChannelsPositionUpdate: GuildChannelsPositionUpdate { client: [Circular *1] },
//     GuildDelete: GuildDeleteAction { client: [Circular *1], deleted: Map(0) {} },
//     GuildEmojiCreate: GuildEmojiCreateAction { client: [Circular *1] },
//     GuildEmojiDelete: GuildEmojiDeleteAction { client: [Circular *1] },
//     GuildEmojiUpdate: GuildEmojiUpdateAction { client: [Circular *1] },
//     GuildEmojisUpdate: GuildEmojisUpdateAction { client: [Circular *1] },
//     GuildIntegrationsUpdate: GuildIntegrationsUpdate { client: [Circular *1] },
//     GuildMemberRemove: GuildMemberRemoveAction { client: [Circular *1] },
//     GuildMemberUpdate: GuildMemberUpdateAction { client: [Circular *1] },
//     GuildRoleCreate: GuildRoleCreate { client: [Circular *1] },
//     GuildRoleDelete: GuildRoleDeleteAction { client: [Circular *1] },
//     GuildRoleUpdate: GuildRoleUpdateAction { client: [Circular *1] },
//     GuildRolesPositionUpdate: GuildRolesPositionUpdate { client: [Circular *1] },
//     GuildScheduledEventCreate: GuildScheduledEventCreateAction { client: [Circular *1] },
//     GuildScheduledEventDelete: GuildScheduledEventDeleteAction { client: [Circular *1] },
//     GuildScheduledEventUpdate: GuildScheduledEventUpdateAction { client: [Circular *1] },
//     GuildScheduledEventUserAdd: GuildScheduledEventUserAddAction { client: [Circular *1] },
//     GuildScheduledEventUserRemove: GuildScheduledEventUserRemoveAction { client: [Circular *1] },
//     GuildStickerCreate: GuildStickerCreateAction { client: [Circular *1] },
//     GuildStickerDelete: GuildStickerDeleteAction { client: [Circular *1] },
//     GuildStickerUpdate: GuildStickerUpdateAction { client: [Circular *1] },
//     GuildStickersUpdate: GuildStickersUpdateAction { client: [Circular *1] },
//     GuildUpdate: GuildUpdateAction { client: [Circular *1] },
//     InteractionCreate: InteractionCreateAction { client: [Circular *1] },
//     InviteCreate: InviteCreateAction { client: [Circular *1] },
//     InviteDelete: InviteDeleteAction { client: [Circular *1] },
//     MessageCreate: MessageCreateAction { client: [Circular *1] },
//     MessageDelete: MessageDeleteAction { client: [Circular *1] },
//     MessageDeleteBulk: MessageDeleteBulkAction { client: [Circular *1] },
//     MessageReactionAdd: MessageReactionAdd { client: [Circular *1] },
//     MessageReactionRemove: MessageReactionRemove { client: [Circular *1] },
//     MessageReactionRemoveAll: MessageReactionRemoveAll { client: [Circular *1] },
//     MessageReactionRemoveEmoji: MessageReactionRemoveEmoji { client: [Circular *1] },
//     MessageUpdate: MessageUpdateAction { client: [Circular *1] },
//     PresenceUpdate: PresenceUpdateAction { client: [Circular *1] },
//     StageInstanceCreate: StageInstanceCreateAction { client: [Circular *1] },
//     StageInstanceDelete: StageInstanceDeleteAction { client: [Circular *1] },
//     StageInstanceUpdate: StageInstanceUpdateAction { client: [Circular *1] },
//     ThreadCreate: ThreadCreateAction { client: [Circular *1] },
//     ThreadDelete: ThreadDeleteAction { client: [Circular *1] },
//     ThreadListSync: ThreadListSyncAction { client: [Circular *1] },
//     ThreadMemberUpdate: ThreadMemberUpdateAction { client: [Circular *1] },
//     ThreadMembersUpdate: ThreadMembersUpdateAction { client: [Circular *1] },
//     TypingStart: TypingStart { client: [Circular *1] },
//     UserUpdate: UserUpdateAction { client: [Circular *1] },
//     VoiceStateUpdate: VoiceStateUpdate { client: [Circular *1] },
//     WebhooksUpdate: WebhooksUpdate { client: [Circular *1] }


// const s5_server = discord_client.guilds.cache.get(process.env.server_id);
// let s5_roles = await s5_server.roles.fetch();
// let swap = true; 
// s5_roles.forEach(r => {
//   if (r.name.includes('Level')) {
//     r.edit({ hoist: swap });
//   }
//   else if (r.name.includes('Color')) {
//     r.edit({ hoist: !swap })
//   }
// });




// const s4_server = discord_client.guilds.cache.get('887429951299682305');
// let s5_members = [];

// OH GOD OH GOD
// let s5_res = await s5_server.members.fetch();
// s5_res.forEach(m => {
//   if (m.user.bot) return;
//   let found = false;
//   m._roles.forEach(r => {
//     let rrole = s5_server.roles.cache.find(role => role.id === r);
//     if (rrole && rrole.name.includes("Level")) {
//       if (!found) {
//         found = true;
//       }
//       else {
//         console.log(m.user.username);
//       }
//     }
//   });
// });
// OH GOD OH GOD

// let expenses = [
//   { name: "beanbags", count: 99, price: 18 },
//   { name: "chairs",   count: 12, price: 159 },
//   { name: "couch",    count: 1,  price: 899 },
//   { name: "loveseat", count: 1,  price: 369 },
//   { name: "futon",    count: 1,  price: 169 },
// ];


// let total = 0; 
// expenses.forEach(e => {
//   let curr_item_price = e.count * e.price; 
//   total += curr_item_price;
//   console.log(`item: ${e.name} - cost: ${curr_item_price}`);
// });
// console.log('total price: ', total);



// let set_1 = 0;
// let set_2 = 0;
// let set_3 = 0;
// let set_4 = 0;
// let i = 1;
// s5_res.forEach(m => {
//   if (m.user.bot == true) return;
//   let num = m.user.id.slice(16, 18);
//   console.log(m.user.username, num, i++);
//   if (num <= 16) {
//     set_1++;
//     console.log('set_1\n');
//   }
//   else if (num >= 17 && num <= 36 || m.user.username == 'wereone') {
//     set_2++;
//     console.log('set_2\n');
//   }
//   else if (num >= 38 && num <= 65 || m.user.username == 'Bandit') {
//     set_3++;
//     console.log('set_3\n');
//   }
//   else {
//     set_4++;
//     console.log('set_4\n');
//   }
//   // let role = s5_server.roles.cache.find(r => r.id === "976728148215488523");
//   // m.roles.add(role);
//   // s5_members.push(`${m.user.username}#${m.user.discriminator}`);
// });
// console.log(set_1, set_2, set_3, set_4, set_1 + set_2 + set_3 + set_4);



// let s4_members = [];
// let s4_res = await s4_server.members.fetch();
// s4_res.forEach(m => {
//   if (m.user.bot == true) return;
//   s4_members.push(`${m.user.username}#${m.user.discriminator}`);
// });
// let forgotten_members = [];
// let members = [];
// for (m of s4_members) {
//   if (!s5_members.includes(m)) {
//     forgotten_members.push(m);
//   }
//   else {
//     members.push(m);
//   }
// }
// let new_members = [];
// for (m of s5_members) {
//   if (!s4_members.includes(m)) {
//     new_members.push(m);
//   }
// }

// console.log('members', members.length, members);
// console.log('forgotten',forgotten_members.length, forgotten_members);
// console.log('new',new_members.length, new_members);