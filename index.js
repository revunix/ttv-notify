const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const config = {
    "telegram": {
        "token": process.env.TELEGRAM_TOKEN,
        "chatid": process.env.TELEGRAM_CHATID
    },
    "twitch": {
        "client_id": process.env.TWITCH_CLIENT_ID,
        "client_secret": process.env.TWITCH_CLIENT_SECRET,
        "streamers": process.env.TWITCH_STREAMERS ? process.env.TWITCH_STREAMERS.split(',') : []
    }
};

const telegramToken = config.telegram.token;
const chatId = config.telegram.chatid;
const twitchClientId = config.twitch.client_id;
const twitchClientSecret = config.twitch.client_secret;
const streamers = config.twitch.streamers;

const bot = new TelegramBot(telegramToken, { polling: false });
let botPolling = false;
let liveStreamers = new Set();
let botRunning = false;

(async () => {
    if (botRunning) {
        console.log('Bot is already running. Exiting...');
        return;
    }

    botRunning = true;
    const token = await getAccessToken();
    if (token) {
        console.log('Starting monitoring...');
        try {
            await checkStreamStatus(token); // Initial check
            setInterval(async () => {
                try {
                    const newToken = await getAccessToken(); // Get a new token for each interval
                    await checkStreamStatus(newToken);
                } catch (error) {
                    console.error('Error during interval check:', error);
                }
            }, 60000); // Check every 60 seconds
        } catch (error) {
            console.error('Error in main function:', error);
            if (error.code === 'ETELEGRAM') {
                console.error('ETELEGRAM: 409 Conflict: terminated by other getUpdates request; make sure that only one bot instance is running');
                botRunning = false; // Reset the flag if there's an error
            }
        }
    }
})().catch(error => {
    console.error('Error in main function:', error);
    if (error.code === 'ETELEGRAM') {
        console.error('ETELEGRAM: 409 Conflict: terminated by other getUpdates request; make sure that only one bot instance is running');
        botRunning = false; // Reset the flag if there's an error
    }
});

async function getAccessToken() {
    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: twitchClientId,
                client_secret: twitchClientSecret,
                grant_type: 'client_credentials'
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
}

async function checkStreamStatus(token) {
    try {
        const response = await axios.get('https://api.twitch.tv/helix/streams', {
            headers: {
                'Client-ID': twitchClientId,
                'Authorization': `Bearer ${token}`
            },
            params: {
                user_login: streamers
            }
        });
        const liveStreams = response.data.data;

        liveStreams.forEach(stream => {
            const { user_name, game_name, viewer_count, thumbnail_url } = stream;

            if (!liveStreamers.has(user_name)) {
                liveStreamers.add(user_name);

                const messageTemplate = process.env.MESSAGE_TEMPLATE;

                const message = messageTemplate
                    .replace('{user_name}', user_name)
                    .replace('{game_name}', game_name)
                    .replace('{viewer_count}', viewer_count)
                    .replace('{thumbnail_url}', thumbnail_url)
                    .replace('{user_url}', `https://www.twitch.tv/${user_name}`);

                bot.sendMessage(chatId, message.trim(), {
                    disable_web_page_preview: false
                });
            }
        });

        // Remove streamers who are no longer live
        liveStreamers.forEach(streamer => {
            if (!liveStreams.some(stream => stream.user_name === streamer)) {
                liveStreamers.delete(streamer);
            }
        });
    } catch (error) {
        console.error('Error checking stream status:', error);
    }
}

// Keep the process alive
setInterval(() => {}, 1000);
