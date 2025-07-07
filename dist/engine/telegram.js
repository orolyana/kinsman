"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramEngine = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const site_1 = require("../site");
const log_1 = require("../lib/log");
const date_time_1 = require("../lib/date_time");
process.env["NTBA_FIX_350"] = 'true';
const starting = Date.now();
class TelegramEngine {
}
exports.TelegramEngine = TelegramEngine;
_a = TelegramEngine;
TelegramEngine.processWebHook = (body) => {
    if (!site_1.Site.TG_POLLING) {
        try {
            _a.bot.processUpdate(body);
        }
        catch (error) {
            log_1.Log.dev(error);
        }
    }
};
TelegramEngine.startMessage = () => {
    let m = `👋 ${site_1.Site.TITLE} been awake since ${(0, date_time_1.getDateTime)(starting)}`;
    m += `\n\n👉 Send a message conatining a bunch of valid pairs to add them to pairs e.g. \`GBPUSD=X JPYEUR=X\``;
    return m;
};
TelegramEngine.start = () => {
    return new Promise((resolve, reject) => {
        _a.bot = new node_telegram_bot_api_1.default(site_1.Site.TG_TOKEN, {
            polling: site_1.Site.TG_POLLING,
            request: {
                agentOptions: {
                    family: site_1.Site.FORCE_FAMILY_4 ? 4 : undefined,
                },
                url: '',
            }
        });
        _a.bot.setMyCommands([
            {
                command: "/start",
                description: "👋"
            },
            {
                command: "/pairs",
                description: "Manage Pairs"
            },
        ]);
        if (!site_1.Site.TG_POLLING) {
            _a.bot.setWebHook(`${site_1.Site.URL}/webhook`, {
                secret_token: site_1.Site.TG_WH_SECRET_TOKEN,
            });
        }
        _a.bot.on("text", (msg) => __awaiter(void 0, void 0, void 0, function* () {
            var _b;
            let content = (msg.text || "").trim();
            const pid = msg.chat.id || ((_b = msg.from) === null || _b === void 0 ? void 0 : _b.id);
            const noteRegex = /^TITLE=(.+)\nBODY=([\s\S]+)$/;
            if (pid && pid == site_1.Site.TG_CHAT_ID) {
                if (/^\/start$/.test(content)) {
                    _a.sendMessage(_a.startMessage());
                }
                else if (noteRegex.test(content)) {
                    // const match = content.match(noteRegex);
                    // if (match) {
                    //     const title = match[1];
                    //     const body = match[2];
                    //     const sent = await NotificationEngine.sendToAllUsers({
                    //         title,
                    //         body,
                    //     });
                    //     if (sent) {
                    //         TelegramEngine.sendMessage(`✅ Notification sent to ${formatNumber(sent)} user${sent != 1 ? 's' : ''}`);
                    //     }
                    //     else {
                    //         TelegramEngine.sendMessage(`😔 Sorry! Notifiction could not be sent`);
                    //     }
                    // }
                }
                else {
                    _a.sendMessage(`😔 Sorry! ${site_1.Site.TITLE} could not understand your message\n\n` + _a.startMessage());
                }
            }
        }));
        _a.bot.on("callback_query", (callbackQuery) => __awaiter(void 0, void 0, void 0, function* () {
            var _b, _c, _d;
            const pid = ((_b = callbackQuery.message) === null || _b === void 0 ? void 0 : _b.chat.id) || ((_d = (_c = callbackQuery.message) === null || _c === void 0 ? void 0 : _c.from) === null || _d === void 0 ? void 0 : _d.id);
            if (pid && pid == site_1.Site.TG_CHAT_ID) {
                if (callbackQuery.data == "refreshstats") {
                    try {
                        _a.bot.answerCallbackQuery(callbackQuery.id);
                        // if (message != TelegramEngine.#lastStatContent) {
                        //     const done = await TelegramEngine.#bot.editMessageText(TelegramEngine.sanitizeMessage(message), {
                        //         chat_id: Site.TG_CHAT_ID,
                        //         message_id: callbackQuery.message.message_id,
                        //         parse_mode: "MarkdownV2",
                        //         disable_web_page_preview: true,
                        //         reply_markup: {
                        //             inline_keyboard: inline
                        //         }
                        //     });
                        //     if (done) {
                        //         TelegramEngine.#lastStatContent = message;
                        //     }
                        // }
                    }
                    catch (error) {
                        log_1.Log.dev(error);
                    }
                }
                else {
                    let content = callbackQuery.data || "";
                    content = content.replace(/\-/g, ".").trim().replace(/_/g, " ").trim();
                    if (content.startsWith("trader ")) {
                        let temp1 = content.split(" ");
                        let newStatus = temp1[1] == "true";
                        // const newv = Trader.toggle();
                        // try {
                        //     TelegramEngine.#bot.answerCallbackQuery(callbackQuery.id);
                        //     const { message, inline } = TelegramEngine.#getStatsContent();
                        //     const done = await TelegramEngine.#bot.editMessageText(TelegramEngine.sanitizeMessage(message), {
                        //         chat_id: Site.TG_CHAT_ID,
                        //         message_id: callbackQuery.message.message_id,
                        //         parse_mode: "MarkdownV2",
                        //         disable_web_page_preview: true,
                        //         reply_markup: {
                        //             inline_keyboard: inline
                        //         }
                        //     });
                        //     if (done) {
                        //         TelegramEngine.#lastStatContent = message;
                        //     }
                        // } catch (error) {
                        //     Log.dev(error);
                        // }
                    }
                }
            }
        }));
        _a.bot.on("polling_error", (err) => {
            log_1.Log.dev(`Telegram > Polling error`, err);
        });
        _a.bot.on("webhook_error", (err) => {
            log_1.Log.dev(`Telegram > Webhook error`, err);
        });
        log_1.Log.flow(['Telegram', 'Initialized.'], 0);
        resolve(true);
    });
};
TelegramEngine.sendStringAsTxtFile = (content, caption, filename) => {
    return new Promise((resolve, reject) => {
        _a.bot.sendDocument(site_1.Site.TG_CHAT_ID, Buffer.from(content, "utf8"), {
            parse_mode: "MarkdownV2",
            caption: _a.sanitizeMessage(caption),
        }, {
            contentType: "text/plain",
            filename: filename,
        }).then(r => {
            resolve(true);
        }).catch(err => {
            log_1.Log.dev(err);
            resolve(false);
        });
    });
};
TelegramEngine.sendStringAsJSONFile = (content, caption, filename) => {
    return new Promise((resolve, reject) => {
        _a.bot.sendDocument(site_1.Site.TG_CHAT_ID, Buffer.from(content, "utf8"), {
            parse_mode: "MarkdownV2",
            caption: _a.sanitizeMessage(caption),
        }, {
            contentType: "application/json",
            filename: filename,
        }).then(r => {
            resolve(true);
        }).catch(err => {
            log_1.Log.dev(err);
            resolve(false);
        });
    });
};
TelegramEngine.deleteMessage = (messageId) => {
    return new Promise((resolve, reject) => {
        _a.bot.deleteMessage(site_1.Site.TG_CHAT_ID, messageId).then(() => {
            resolve(true);
        }).catch(err => {
            log_1.Log.dev(err);
            resolve(false);
        });
    });
};
TelegramEngine.messageQueue = [];
TelegramEngine.processing = false;
TelegramEngine.WINDOW_DURATION = 1000;
TelegramEngine.windowStart = Date.now();
TelegramEngine.globalCount = 0;
TelegramEngine.chatCounts = {};
TelegramEngine.sendMessage = (message, callback = (id) => { }, opts = {
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true,
}, isTemp = false) => {
    _a.messageQueue.push({
        message,
        callback,
        opts,
        isTemp,
    });
    if (!_a.processing) {
        _a.processQueue();
    }
};
TelegramEngine.processQueue = () => __awaiter(void 0, void 0, void 0, function* () {
    _a.processing = true;
    while (_a.messageQueue.length > 0) {
        const now = Date.now();
        // Reset the counters if the window has passed
        if (now - _a.windowStart >= _a.WINDOW_DURATION) {
            _a.windowStart = now;
            _a.globalCount = 0;
            _a.chatCounts = {};
        }
        let sentAny = false;
        // Use  variable to track the minimal wait time needed for any blocked message
        let nextDelay = _a.WINDOW_DURATION;
        // Iterate through the queue and process eligible messages
        for (let i = 0; i < _a.messageQueue.length; i++) {
            const msg = _a.messageQueue[i];
            const chatCount = _a.chatCounts[msg.chatId] || 0;
            const globalLimitReached = _a.globalCount >= 30;
            const chatLimitReached = chatCount >= 1;
            // If sending this message does not exceed limits, send it immediately
            if (!globalLimitReached && !chatLimitReached) {
                _a.globalCount++;
                _a.chatCounts[msg.chatId] = chatCount + 1;
                // Remove message from the queue and send it
                _a.messageQueue.splice(i, 1);
                // Adjust index due to removal
                i--;
                _a.sendIndividualMessage(msg);
                sentAny = true;
            }
            else {
                // Determine the delay required for either global or per-chat counter to reset
                let globalDelay = globalLimitReached ? _a.WINDOW_DURATION - (now - _a.windowStart) : 0;
                let chatDelay = chatLimitReached ? _a.WINDOW_DURATION - (now - _a.windowStart) : 0;
                // The message will be eligible after the maximum of these two delays
                const delayForMsg = Math.max(globalDelay, chatDelay);
                // Save the minimal delay needed among all blocked messages
                if (delayForMsg < nextDelay) {
                    nextDelay = delayForMsg;
                }
            }
        }
        // if no messages were sent in this pass, wait for the minimal  required delay
        if (!sentAny) {
            yield new Promise(resolve => setTimeout(resolve, nextDelay));
        }
    }
    _a.processing = false;
});
TelegramEngine.sanitizeMessage = (txt) => txt.replace(/([~>#\+\-=\|{}\.!])/g, '\\$&');
TelegramEngine.lastMessageID = null;
TelegramEngine.lastTokenMessageID = null;
TelegramEngine.sendIndividualMessage = (msg) => {
    const { callback, message, opts, isTemp } = msg;
    _a.bot.sendMessage(site_1.Site.TG_CHAT_ID, _a.sanitizeMessage(message), opts).then((mess) => {
        log_1.Log.dev(`Telegram > Sent text.`);
        if (!isTemp) {
            _a.lastMessageID = mess.message_id;
        }
        callback(mess.message_id);
    }).catch(err => {
        log_1.Log.dev("Telegram > Error sending text", err);
        callback(null);
    });
};
