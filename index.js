import 'dotenv/config';
import mineflayer from 'mineflayer';
import { readFileSync, existsSync } from 'fs';
import express from 'express';

// ==================== ⚙️ DIRECT CONFIGURATION ====================
const CONFIG = {
    HOST: "",
    PORT: null,
    MC_PASSWORD: "Gian2342341",
    BOT_PREFIX: "spikelol",                  // Bot name prefix
    MAX_BOTS: 4,                             // Total kitne bots ek sath active rahenge
    SPAM_INTERVAL: 1500                      // Spam message interval (ms)
};

// ==================== 🌐 Express Uptime Server (Render Freeze Fix) ====================
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
    res.status(200).send('⚡ Spike.lol Bot Direct Raid Mode is Live!');
});

app.listen(PORT, () => {
    console.log(`[HTTP Server] Listening on port ${PORT}`);
});

setInterval(() => {
    console.log(`[HEARTBEAT] Service active. Uptime: ${Math.floor(process.uptime())}s`);
}, 45000);
// ===================================================================================

let bots = [];
let isRunning = true;

function getSpamMessages() {
    try {
        if (!existsSync('spam.txt')) return ['Spike.lol Raid! .gg/spike.lol'];
        const content = readFileSync('spam.txt', 'utf8');
        return content.split('\n').map(m => m.trim()).filter(m => m.length > 0);
    } catch {
        return ['Spike.lol Raid active!'];
    }
}

function sendLog(message) {
    console.log(`[RAID LOG] ${message}`);
}

function createBot(index) {
    if (!isRunning) return;

    // Har naye bot ke liye ek naya random number generate hoga (jaise spikelol_4921)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const botName = `${CONFIG.BOT_PREFIX}_${randomNum}`;

    const botOptions = {
        host: CONFIG.HOST,
        username: botName,
        hideErrors: true
    };
    if (CONFIG.PORT) botOptions.port = Number(CONFIG.PORT);

    const bot = mineflayer.createBot(botOptions);
    bots.push(bot);

    bot.once('spawn', () => {
        sendLog(`🟢 Bot **${botName}** connected to ${CONFIG.HOST}`);
        startHumanBehavior(bot);
        startSpamming(bot);
    });

    bot.on('death', () => {
        sendLog(`💀 Bot **${botName}** died. Respawning...`);
        try { bot.respawn(); } catch (e) {}
    });

    bot.on('windowOpen', (window) => {
        sendLog(`🔐 Bot **${botName}** detected GUI/Chest login.`);
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

    // Jab bot ban ya kick hoga, toh yeh turant naye naam ke sath naya bot le aayega
    bot.on('end', (reason) => {
        sendLog(`🔴 Bot **${botName}** disconnected (${reason}). Replacing with a new bot...`);
        bots = bots.filter(b => b !== bot);
        setTimeout(() => {
            if (isRunning) {
                createBot(index);
            }
        }, 3000);
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
        setTimeout(() => { if (bot && bot.clearControlStates) bot.clearControlStates(); }, 4000);
    }, 6000);

    const jumpInterval = setInterval(() => {
        if (!bot || !bot.entity || !bot._client || bot._client.ended) {
            clearInterval(jumpInterval);
            return;
        }
        bot.setControlState('jump', true);
        setTimeout(() => { if (bot && bot.setControlState) bot.setControlState('jump', false); }, 500);
    }, 10000);

    const lookInterval = setInterval(() => {
        if (!bot || !bot.entity || !bot._client || bot._client.ended) {
            clearInterval(lookInterval);
            return;
        }
        const yaw = Math.random() * Math.PI * 2;
        const pitch = (Math.random() * Math.PI) - (Math.PI / 2);
        bot.look(yaw, pitch, true).catch(() => {});
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

// Automatic Slot maintainer & Auto-Join system
console.log(`[RAID SYSTEM] Initializing auto-join for ${CONFIG.HOST}...`);
const controlInterval = setInterval(() => {
    if (bots.length < CONFIG.MAX_BOTS && isRunning) {
        createBot(bots.length + 1);
    }
}, 2000);
