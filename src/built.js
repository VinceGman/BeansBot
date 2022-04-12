////////////////// guild member updated //////////////////

discord_client.on("guildMemberUpdate", function (oldMember, newMember) {
    let memberChanges = detailedDiff(oldMember, newMember)

    console.log(memberChanges);

    let change = 'unassigned';
    if (memberChanges.updated.hasOwnProperty('communicationDisabledUntilTimestamp')) {
        change = memberChanges.updated.communicationDisabledUntilTimestamp != null ? 'timeout' : 'timeout_removed';
    } else if (memberChanges.updated.hasOwnProperty('_roles')) {
        change = 'roles';
    }

    let bot_log = newMember.guild.channels.cache.get(process.env.discord_bot_log_id);

    switch (change) {
        case 'timeout':
            bot_log.send(`${newMember.user.username}#${newMember.user.discriminator} is timed out.`);
            break;
        case 'timeout_removed':
            bot_log.send(`${newMember.user.username}#${newMember.user.discriminator} is no longer timed out.`);
            break;
        case 'roles':
            bot_log.send(`${newMember.user.username}#${newMember.user.discriminator} roles updated.`);
            break;
        default:
            console.log(change);
    }
});

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