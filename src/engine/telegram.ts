import TelegramBot from 'node-telegram-bot-api';
import { Site } from '../site';
import { Log } from '../lib/log';
import { getDateTime } from '../lib/date_time';
import { FFF, formatNumber } from '../lib/format_number';
import { PairEngine } from './pair';
import { RegexPatterns } from '../lib/regex';

process.env["NTBA_FIX_350"] = 'true';

const starting = Date.now();

type CBF = (messageId: string) => void;

export class TelegramEngine {

    private static bot: TelegramBot;

    static processWebHook = (body: any) => {
        if (!Site.TG_POLLING) {
            try {
                TelegramEngine.bot.processUpdate(body);
            } catch (error) {
                Log.dev(error);
            }

        }
    }

    private static startMessage = () => {
        let m: string = `👋 ${Site.TITLE} been awake since ${getDateTime(starting)}`;
        m += `\n\n👉 Send a message conatining a bunch of valid pairs to add them to pairs e.g. \`GBPUSD=X JPYEUR=X\``;
        return m;
    }

    private static pairsMessage = () => {
        let message: string = `💱 *Pairs* - ${getDateTime()}\n`;
        let inline: TelegramBot.InlineKeyboardButton[][] = [
            [
                {
                    text: '♻️ Refresh',
                    callback_data: 'refreshpairs',
                }
            ]
        ];
        const pairs = PairEngine.getAllPairs();
        let sn = 1;
        for (const pair of pairs) {
            message += `\n💲 ${sn}. ${pair.symbol}\n`;
            if (pair.candlestickData.length > 0) {
                message += `Mark Price 🏷️ ${FFF(pair.getMarkPrice(), 6)}\n`;
            }
            if (pair.fiftyTwoWeekHigh && pair.fiftyTwoWeekLow) {
                message += `52 Week ⬆️ ${FFF(pair.fiftyTwoWeekHigh, 6)} ⬇️ ${FFF(pair.fiftyTwoWeekLow, 6)}\n`;
            }
            if (pair.regularMarketDayHigh && pair.regularMarketDayLow && pair.regularMarketPrice) {
                message += `Regulars ⏺️ Day ⬆️ ${FFF(pair.regularMarketDayHigh, 6)} | Day ⬇️ ${FFF(pair.regularMarketDayLow, 6)} | 🏷️ ${FFF(pair.regularMarketPrice, 6)} | 📦 ${FFF(pair.regularMarketVolume, 6)}\n`;
            }

            inline.push([
                {
                    text: `🗑 ${sn}`,
                    callback_data: `delete_${pair.symbol}`,
                },
                {
                    text: `🏷️ ${sn}`,
                    callback_data: `price_${pair.symbol}`,
                },
            ]);
            sn++;
        }
        return { message: pairs.length ? message : `${message}\n❌ No pairs available`, inline };
    }

    static start = () => {
        return new Promise<boolean>((resolve, reject) => {
            TelegramEngine.bot = new TelegramBot(Site.TG_TOKEN, {
                polling: Site.TG_POLLING,
                request: {
                    agentOptions: {
                        family: Site.FORCE_FAMILY_4 ? 4 : undefined,
                    },
                    url: '',
                }
            });
            TelegramEngine.bot.setMyCommands([
                {
                    command: "/start",
                    description: "👋"
                },
                {
                    command: "/pairs",
                    description: "Manage Pairs"
                },
            ]);
            if (!Site.TG_POLLING) {
                TelegramEngine.bot.setWebHook(`${Site.URL}/webhook`, {
                    secret_token: Site.TG_WH_SECRET_TOKEN,
                });
            }
            TelegramEngine.bot.on("text", async (msg) => {
                let content = (msg.text || "").trim();
                const pid = msg.chat.id || msg.from?.id;
                const noteRegex = /^TITLE=(.+)\nBODY=([\s\S]+)$/;
                if (pid && pid == Site.TG_CHAT_ID) {
                    if (/^\/start$/.test(content)) {
                        TelegramEngine.sendMessage(TelegramEngine.startMessage());
                    }
                    else if (/^\/pairs$/.test(content)) {
                        const { inline, message } = TelegramEngine.pairsMessage();
                        TelegramEngine.sendMessage(message, mid => { }, {
                            disable_web_page_preview: true,
                            parse_mode: 'MarkdownV2',
                            reply_markup: {
                                inline_keyboard: inline,
                            }
                        });
                    }
                    else if (RegexPatterns.pairWithin.test(content)) {
                        const symbols = content.split(" ").filter(x => RegexPatterns.pair.test(x));
                        let a = 0;
                        let b = 0;
                        for (let i = 0; i < symbols.length; i++) {
                            const symbol = symbols[i];
                            const done = await PairEngine.addPair(symbol);
                            if (done) {
                                a++;
                            }
                            else {
                                b++;
                            }
                        }
                        if (a > 0) {
                            TelegramEngine.sendMessage(`✅ ${a} pair${a == 1 ? "" : "s"} added`);
                        }
                        if (b > 0) {
                            TelegramEngine.sendMessage(`❌ Could not add ${b} pair${b == 1 ? "" : "s"}`);
                        }
                    }
                    else {
                        TelegramEngine.sendMessage(`😔 Sorry! ${Site.TITLE} could not understand your message\n\n` + TelegramEngine.startMessage());
                    }
                }
            });

            TelegramEngine.bot.on("callback_query", async (callbackQuery) => {
                const pid = callbackQuery.message?.chat.id || callbackQuery.message?.from?.id;
                if (pid && pid == Site.TG_CHAT_ID) {
                    if (callbackQuery.data == "refreshpairs") {
                        try {
                            TelegramEngine.bot.answerCallbackQuery(callbackQuery.id);
                            const { message, inline } = TelegramEngine.pairsMessage();
                            const done = await TelegramEngine.bot.editMessageText(TelegramEngine.sanitizeMessage(message), {
                                chat_id: Site.TG_CHAT_ID,
                                message_id: callbackQuery?.message?.message_id,
                                parse_mode: "MarkdownV2",
                                disable_web_page_preview: true,
                                reply_markup: {
                                    inline_keyboard: inline
                                }
                            });
                        } catch (error) {
                            Log.dev(error);
                        }
                    }
                    else {
                        let content = callbackQuery.data || "";
                        content = content.replace(/\-/g, ".").trim().replace(/_/g, " ").trim();
                        if (content.startsWith("delete ")) {
                            let temp = content.split(" ");
                            let symbol = temp[1];
                            const deleted = await PairEngine.deletePair(symbol);
                            TelegramEngine.bot.answerCallbackQuery(callbackQuery.id, {
                                text: deleted ? `✅ Deleted ${symbol}` : `❌ Could not delete ${symbol}`,
                            });
                            try {
                                const { message, inline } = TelegramEngine.pairsMessage();
                                const done = await TelegramEngine.bot.editMessageText(TelegramEngine.sanitizeMessage(message), {
                                    chat_id: Site.TG_CHAT_ID,
                                    message_id: callbackQuery?.message?.message_id,
                                    parse_mode: "MarkdownV2",
                                    disable_web_page_preview: true,
                                    reply_markup: {
                                        inline_keyboard: inline
                                    }
                                });
                            } catch (error) {
                                Log.dev(error);
                            }
                        }
                        else if (content.startsWith("price ")) {
                            let temp = content.split(" ");
                            let symbol = temp[1];
                            const pair = PairEngine.getPair(symbol);
                            const price = pair ? pair.getMarkPrice() : 0;
                            TelegramEngine.bot.answerCallbackQuery(callbackQuery.id, {
                                text: price ? `✅ ${symbol} ${FFF(price, 6)}` : `❌ Could not get price for ${symbol}`,
                            });
                        }
                    }
                }
            });

            TelegramEngine.bot.on("polling_error", (err) => {
                Log.dev(`Telegram > Polling error`, err);
            });
            TelegramEngine.bot.on("webhook_error", (err) => {
                Log.dev(`Telegram > Webhook error`, err);
            });

            Log.flow(['Telegram', 'Initialized.'], 0);
            resolve(true);
        })
    }

    static sendStringAsTxtFile = (content: string, caption: string, filename: string) => {
        return new Promise<boolean>((resolve, reject) => {
            TelegramEngine.bot.sendDocument(Site.TG_CHAT_ID, Buffer.from(content, "utf8"), {
                parse_mode: "MarkdownV2",
                caption: TelegramEngine.sanitizeMessage(caption),
            }, {
                contentType: "text/plain",
                filename: filename,
            }).then(r => {
                resolve(true);
            }).catch(err => {
                Log.dev(err);
                resolve(false);
            });
        })
    }

    static sendStringAsJSONFile = (content: string, caption: string, filename: string) => {
        return new Promise((resolve, reject) => {
            TelegramEngine.bot.sendDocument(Site.TG_CHAT_ID, Buffer.from(content, "utf8"), {
                parse_mode: "MarkdownV2",
                caption: TelegramEngine.sanitizeMessage(caption),
            }, {
                contentType: "application/json",
                filename: filename,
            }).then(r => {
                resolve(true);
            }).catch(err => {
                Log.dev(err);
                resolve(false);
            });
        })
    }

    static deleteMessage = (messageId: number) => {
        return new Promise<boolean>((resolve, reject) => {
            TelegramEngine.bot.deleteMessage(Site.TG_CHAT_ID, messageId).then(() => {
                resolve(true);
            }
            ).catch(err => {
                Log.dev(err);
                resolve(false);
            }
            );
        })
    }

    private static messageQueue: any[] = [];
    private static processing: boolean = false;
    private static WINDOW_DURATION: number = 1000;
    private static windowStart: number = Date.now();
    private static globalCount: number = 0;
    private static chatCounts: any = {};

    static sendMessage = (message: string, callback: CBF = (id) => { }, opts: TelegramBot.SendMessageOptions = {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
    }, isTemp = false,) => {
        TelegramEngine.messageQueue.push({
            message,
            callback,
            opts,
            isTemp,
        });

        if (!TelegramEngine.processing) {
            TelegramEngine.processQueue();
        }
    }

    private static processQueue = async () => {
        TelegramEngine.processing = true;

        while (TelegramEngine.messageQueue.length > 0) {
            const now = Date.now();

            // Reset the counters if the window has passed
            if (now - TelegramEngine.windowStart >= TelegramEngine.WINDOW_DURATION) {
                TelegramEngine.windowStart = now;
                TelegramEngine.globalCount = 0;
                TelegramEngine.chatCounts = {};
            }

            let sentAny = false;
            // Use  variable to track the minimal wait time needed for any blocked message
            let nextDelay = TelegramEngine.WINDOW_DURATION;

            // Iterate through the queue and process eligible messages
            for (let i = 0; i < TelegramEngine.messageQueue.length; i++) {
                const msg = TelegramEngine.messageQueue[i];
                const chatCount = TelegramEngine.chatCounts[msg.chatId] || 0;
                const globalLimitReached = TelegramEngine.globalCount >= 30;
                const chatLimitReached = chatCount >= 1;

                // If sending this message does not exceed limits, send it immediately
                if (!globalLimitReached && !chatLimitReached) {
                    TelegramEngine.globalCount++;
                    TelegramEngine.chatCounts[msg.chatId] = chatCount + 1;
                    // Remove message from the queue and send it
                    TelegramEngine.messageQueue.splice(i, 1);
                    // Adjust index due to removal
                    i--;
                    TelegramEngine.sendIndividualMessage(msg);
                    sentAny = true;
                }
                else {
                    // Determine the delay required for either global or per-chat counter to reset
                    let globalDelay = globalLimitReached ? TelegramEngine.WINDOW_DURATION - (now - TelegramEngine.windowStart) : 0;
                    let chatDelay = chatLimitReached ? TelegramEngine.WINDOW_DURATION - (now - TelegramEngine.windowStart) : 0;
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
                await new Promise(resolve => setTimeout(resolve, nextDelay));
            }
        }

        TelegramEngine.processing = false;
    }

    static sanitizeMessage = (txt: string) => txt.replace(/([~>#\+\-=\|{}\.!])/g, '\\$&');

    private static lastMessageID: any = null;
    private static lastTokenMessageID: any = null

    private static sendIndividualMessage = (msg: any) => {
        const { callback, message, opts, isTemp } = msg;
        TelegramEngine.bot.sendMessage(Site.TG_CHAT_ID, TelegramEngine.sanitizeMessage(message), opts).then((mess) => {
            Log.dev(`Telegram > Sent text.`);
            if (!isTemp) {
                TelegramEngine.lastMessageID = mess.message_id;
            }
            callback(mess.message_id);
        }).catch(err => {
            Log.dev("Telegram > Error sending text", err);
            callback(null);
        });
    }


}