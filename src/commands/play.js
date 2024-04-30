const { getVoiceConnection, joinVoiceChannel, createAudioResource, createAudioPlayer, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const { getQueue, setQueue, deleteQueue, hasQueue } = require('../utility/queueManager');

module.exports = {
    name: 'play',
    description: "Plays YouTube links or adds them to the queue",
    category: 'music',
    admin: false,
    type: "production",
    cooldown: 4,
    async execute(discord_client, msg, args, admin) {
        if (!msg.member.voice.channel) {
            return msg.channel.send("You need to be in a voice channel to play music!");
        }

        const songInfo = await ytdl.getInfo(args[0]);
        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
        };

        const guildId = msg.guild.id;
        if (!hasQueue(guildId)) {
            const queueConstruct = {
                textChannel: msg.channel,
                voiceChannel: msg.member.voice.channel,
                connection: null,
                songs: [],
                volume: 35, // Default volume at 35
                playing: true,
            };

            setQueue(guildId, queueConstruct);
            queueConstruct.songs.push(song);

            try {
                const connection = joinVoiceChannel({
                    channelId: msg.member.voice.channel.id,
                    guildId: guildId,
                    adapterCreator: msg.guild.voiceAdapterCreator,
                    selfDeaf: false // Bot will not deafen itself upon joining
                });
                queueConstruct.connection = connection;
                play(guildId, queueConstruct.songs[0]);
            } catch (err) {
                console.error('Error connecting to voice channel: ', err);
                deleteQueue(guildId);
                return msg.channel.send("Failed to connect to voice channel.");
            }
        } else {
            const serverQueue = getQueue(guildId);
            serverQueue.songs.push(song);
            return msg.channel.send(`${song.title} has been added to the queue!`);
        }
    }
};

async function play(guildId, song) {
    const serverQueue = getQueue(guildId);
    if (!song) {
        if (serverQueue.voiceChannel) {
            const connection = getVoiceConnection(serverQueue.voiceChannel.guild.id);
            if (connection) {
                connection.destroy(); // Properly use the voice connection to leave or destroy it
            }
        }
        deleteQueue(guildId);
        return;
    }

    const stream = ytdl(song.url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 }); // Increased buffer size
    const resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true
    });
    resource.volume.setVolumeLogarithmic(serverQueue.volume / 100); // Set the volume logaritmically

    const player = createAudioPlayer();
    serverQueue.connection.subscribe(player);
    player.play(resource);

    player.on(AudioPlayerStatus.Idle, () => {
        serverQueue.songs.shift();
        play(guildId, serverQueue.songs[0]);
    });

    player.on('error', error => console.error('Error from audio player:', error));
    serverQueue.textChannel.send(`Now playing: **${song.title}**`);
}