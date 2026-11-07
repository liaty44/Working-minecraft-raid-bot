import 'dotenv/config';
import mineflayer from 'mineflayer';
import { readFileSync, existsSync } from 'fs';
import express from 'express';

// ==================== ⚙️ ENVIRONMENT CONFIGURATION ====================
const CONFIG = {
    HOST: process.env.MC_HOST || "CraftySmpseason2.pixelforge.gg",
    PORT: process.env.MC_PORT ? Number(process.env.MC_PORT) : null,
    MC_PASSWORD: process.env.MC_PASSWORD || "Gian2342341",
    BOT_PREFIX: process.env.BOT_PREFIX || "Spikelol",
    MAX_BOTS: process.env.MAX_BOTS ? Number(process.env.MAX_BOTS) : 2, // Load kam karne ke liye max bots 2 kiye hain
    VERSION: process.env.MC_VERSION || "1.20.1",
    SPAM_INTERVAL: 3000,
    WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || ""
};

// ==================== 🌐 Express Uptime Server ====================
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
    res.status(200).send('⚡ Spike.lol Bot Throttled Mode is Live!');
});

app.listen(PORT, () => {
    console.log(`[HTTP Server] Listening on port ${PORT}`);
});

setInterval(() => {
    console.log(`[HEARTBEAT] Service active. Uptime: ${Math.floor(process.uptime())}s`);
}, 45000);
// ===================================================================================

let activeBotsCount = 0;
let isRunning = true;

async function sendDiscordWebhook(content, color = 3066993) {
    if (!CONFIG.WEBHOOK_URL) return;
    try {
        await fetch(CONFIG.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    description: content,
                    color: color,
                    timestamp: new Date().toISOString()
                }]
            })
        });
    } catch (err) {}
}

function getSpamMessages() {
    try {
        if (!existsSync('spam.txt')) return ['Spike.lol Raid! .gg/spike.lol'];
        const content = readFileSync('spam.txt', 'utf8');
        return content.split('\n').map(m => m.trim()).filter(m => m.length > 0);
    } catch {
        return ['Spike.lol Raid active!'];
    }
}

function createBot() {
    if (!isRunning) return;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const botName = `${CONFIG.BOT_PREFIX}_${randomNum}`;

    const botOptions = {
        host: CONFIG.HOST,
        username: botName,
        version: CONFIG.VERSION,
        hideErrors: true // Console spam bachane ke liye errors hide kiye hain
    };
    if (CONFIG.PORT) botOptions.port = CONFIG.PORT;

    let bot;
    try {
        bot = mineflayer.createBot(botOptions);
    } catch (err) {
        return;
    }

    activeBotsCount++;

    bot.once('spawn', () => {
        const logMsg = `🟢 **Bot Connected:** \`${botName}\` joined **${CONFIG.HOST}**`;
        console.log(`[RAID LOG] ${logMsg}`);
        sendDiscordWebhook(logMsg, 65280);
        startHumanBehavior(bot);
        startSpamming(bot);
    });

    bot.on('death', () => {
        try { bot.respawn(); } catch (e) {}
    });

    bot.on('windowOpen', (window) => {
        setTimeout(() => {
            if (window && window.slots && window.slots[11]) {
                bot.clickWindow(11, 0, 0).catch(() => {});
            }
        }, 1000);
    });

    bot.on('chat', (username, message) => {
        if (!bot || username === bot.username) return;
        const msgLower = message.toLowerCase();
        if (msgLower.includes('register') || msgLower.includes('/reg')) {
            bot.chat(`/register ${CONFIG.MC_PASSWORD} ${CONFIG.MC_PASSWORD}`);
        } else if (msgLower.includes('login') || msgLower.includes('/l')) {
            bot.chat(`/login ${CONFIG.MC_PASSWORD}`);
        }
    });

    bot.on('end', (reason) => {
        activeBotsCount = Math.max(0, activeBotsCount - 1);
        const logMsg = `🔴 **Bot Disconnected:** \`${botName}\` (${reason}).`;
        console.log(`[RAID LOG] ${logMsg}`);
        
        // Server ko flood hone se bachane ke liye reconnect delay 10 second kar diya hai
        setTimeout(() => {
            if (isRunning) {
                createBot();
            }
        }, 10000);
    });

    bot.on('error', () => {});
}

function startHumanBehavior(bot) {
    const moveInterval = setInterval(() => {
        if (!bot || !bot.entity || !bot._client || bot._client.ended) {
            clearInterval(moveInterval);
            return;
        }
        const directions = ['forward', 'back', 'left', 'right'];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        bot.setControlState(randomDir, true);
        setTimeout(() => { if (bot && bot.clearControlStates) bot.clearControlStates(); }, 3000);
    }, 8000);
}

function startSpamming(bot) {
    const spamInterval = setInterval(() => {
        if (!bot || !bot.entity || !bot._client || bot._client.ended) {
            clearInterval(spamInterval);
            return;
        }
        const messages = getSpamMessages();
        const rawMsg = messages[Math.floor(Math.random() * messages.length)];
        const randomSuffix = Math.floor(10 + Math.random() * 90);
        const finalMsg = `${rawMsg} [${randomSuffix}]`;
        
        try {
            if (bot && typeof bot.chat === 'function') {
                bot.chat(finalMsg);
            }
        } catch (e) {}
    }, CONFIG.SPAM_INTERVAL);
}

// 🔄 Safe Spawner Loop with gap
console.log(`[RAID SYSTEM] Initializing safe throttled connection for: ${CONFIG.HOST}`);
setInterval(() => {
    if (activeBotsCount < CONFIG.MAX_BOTS && isRunning) {
        createBot();
    }
}, 5000); // Har 5 second mein ek bot join karega taaki ECONNRESET na aaye
