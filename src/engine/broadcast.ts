import TelegramBot from "node-telegram-bot-api";
import { getTimeElapsed } from "../lib/date_time";
import { FFF, formatNumber } from "../lib/format_number";
import { Log } from "../lib/log";
import { Occurrence } from "../model/occurence";
import { Signal } from "../model/signal";
import { Site } from "../site";
import { GroqEngine } from "./groq";

let cachedTelegramEngine: typeof import('./telegram').TelegramEngine | null = null;
const TelegramEngine = async () => {
    if (!cachedTelegramEngine) {
        cachedTelegramEngine = ((await import('./telegram'))).TelegramEngine;
    }
    return cachedTelegramEngine;
}

export class BroadcastEngine {
    private static occurrences: Record<string, Occurrence> = {};

    private static recentSignals: ('long' | 'short')[] = [];

    static getDominantSignal = (): 'long' | 'short' | 'no_signal' => {
        if (BroadcastEngine.recentSignals.length > 2) {
            const longPerc = (BroadcastEngine.recentSignals.filter(x => x == "long").length / BroadcastEngine.recentSignals.length) * 100;
            const shortPerc = (BroadcastEngine.recentSignals.filter(x => x == "short").length / BroadcastEngine.recentSignals.length) * 100;

            if (longPerc >= Site.DC_MIN_DOM_PERC && shortPerc < Site.DC_MIN_DOM_PERC) {
                return "long";
            }

            if (shortPerc >= Site.DC_MIN_DOM_PERC && longPerc < Site.DC_MIN_DOM_PERC) {
                return "short";
            }
        }
        return 'no_signal';
    }

    private static aiHistory: Record<string, { ts: number, supported: boolean, confidence: number, long: boolean, price: number }[]> = {};

    private static computePrompt = (symbol: string, signal: Signal, occurence: number) => {
        return new Promise<{ str: string, obj: { supported: boolean, reason: string, confidence: number } } | null>((resolve, reject) => {
            if (!BroadcastEngine.aiHistory[symbol]) {
                BroadcastEngine.aiHistory[symbol] = [];
            }
            let prompt = [
                {
                    role: "system",
                    content: "",
                },
                {
                    role: "user",
                    content: "",
                },
            ];

            prompt[0].content += `You are ${Site.TITLE || "Bennie"} AI,  a trading assistant skilled in indicator-based strategy evaluation for Forex Futures.`;
            prompt[0].content += `\n\nGiven structured data and recent signal history, determine if the proposed signal is valid.`;
            prompt[0].content += `\n\nRespond ONLY with a JSON object like:`;
            prompt[0].content += `\n\n{\n\t"supported": boolean,\n\t"reason": string,\n\t"confidence": number (0 to 100)\n}`;
            prompt[0].content += `\n\nExample:\n{\n\t"supported": true,\n\t"reason": "ADX confirms strong trend and no reversal signs, supporting the short signal.",\n\t"confidence": 84\n}\n\nNote: Numeric values in parentheses (e.g., 14 or 9/26/52/26) beside indicators represent their parameters when applicable.`;

            prompt[1].content += `# INPUT\n${signal.cachedPrompt[0].join("\n")}`;

            const history = BroadcastEngine.aiHistory[symbol];
            if (history.length > 0) {
                prompt[1].content += `\n\nPrevious Signals:\n` +
                    history.map(row =>
                        `- ${row.long ? "LONG" : "SHORT"} | ${getTimeElapsed(row.ts, Date.now())} ago | ${row.price} | ${row.supported ? "✓" : "✗"} ${row.confidence}%`
                    ).join("\n");
            }

            for (let i = 1; i <= 7; i++) {
                const data = signal.cachedPrompt[i];
                switch (i) {
                    case 1:
                        prompt[1].content += `\n\nEntry: `;
                        // prompt[1].content += `\nTrend/momentum switch detection using a single indicator.\n`;
                        prompt[1].content += `${data.length ? data.map(x => `${x}`).join("") : 'None'}`;
                        break;
                    case 2:
                        prompt[1].content += `\n\nTrend: `;
                        // prompt[1].content += `\nDetermined using multiple trend indicators.\n`;
                        prompt[1].content += `${data.length ? '\n' + data.map(x => `- ${x}`).join("\n") : 'None'}`;
                        break;
                    case 3:
                        prompt[1].content += `\n\nStrength: `;
                        // prompt[1].content += `\nMeasured by ADX. Strong if ADX >= 25.\n`;
                        prompt[1].content += `${data.length ? data.map(x => `${x}`).join("") : 'None'}`;
                        break;
                    case 4:
                        prompt[1].content += `\n\nOver${signal.long ? 'bought' : 'sold'} (Checks if market conditions could reverse the signal): `;
                        // prompt[1].content += `\nChecks if market conditions could reverse the signal.\n`;
                        prompt[1].content += `${data.length ? '\n' + data.map(x => `- ${x}`).join("\n") : `None`}`;
                        break;
                    case 5:
                        // prompt[1].content += `\n\n### STEP 5 - Candlestick Reversal Patterns`;
                        prompt[1].content += `\n\nReversal Candles (Detects candlestick patterns opposing the signal): `;
                        // prompt[1].content += `\nDetects candlestick patterns opposing the signal.\n`;
                        prompt[1].content += `${data.length ? `${data.map(x => `${x}`).join(", ")}` : 'None'}`;
                        break;
                    case 6:
                        prompt[1].content += `\n\nStop Loss Price:  \n`;
                        // prompt[1].content += `\nStop loss price calculated using a volatility or trend-based indicator.\n`;
                        prompt[1].content += `${data.length ? data.map(x => `- ${x}`).join("\n") : 'None'}`;
                        break;
                    case 7:
                        prompt[1].content += `\n\nVolatility: `;
                        // prompt[1].content += `\nComputed using ATR and expressed as a percentage of current price.\n`;
                        prompt[1].content += `${data.length ? data.map(x => `${x}`).join("") : 'None'}`;
                        break;
                    default:
                    // do nothing
                }
            }

            prompt[1].content += `\n\nSignal: **${signal.long ? "LONG" : "SHORT"}** ${occurence > 1 ? `(Occurred ${occurence}x consecutively)` : ''}`;

            prompt[1].content += `\n\n## TASK\nReturn a JSON object only with:\n- supported: true/false\n- reason: short paragraph\n- confidence: 0–100`;

            prompt[0].content = prompt[0].content.replace(/ {2,}/g, " ");
            prompt[1].content = prompt[1].content.replace(/ {2,}/g, " ");

            if (process.env.COLLER) console.log(prompt);

            GroqEngine.request({
                messages: prompt as any,
                callback(r) {
                    if (r.succ) {
                        try {
                            r.message = r.message.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
                            const { supported, reason, confidence } = JSON.parse(r.message);
                            const row = { ts: Date.now(), supported: supported, confidence: confidence, long: signal.long, price: signal.markPrice };

                            BroadcastEngine.aiHistory[symbol].push(row);
                            if (BroadcastEngine.aiHistory[symbol].length > Site.GROQ_MAX_HISTORY_COUNT) {
                                BroadcastEngine.aiHistory[symbol] = BroadcastEngine.aiHistory[symbol].slice(BroadcastEngine.aiHistory[symbol].length - Site.GROQ_MAX_HISTORY_COUNT);
                            }
                            resolve({
                                str: `Supported: ${supported ? 'Yes' : 'No'}\nReason: ${reason}\nConfidence: ${confidence}`,
                                obj: {
                                    confidence: confidence,
                                    reason: reason,
                                    supported: supported,
                                }
                            });
                        } catch (error) {
                            Log.dev(error);
                            resolve(null);
                        }
                    }
                    else {
                        resolve(null);
                    }
                },
            });
        });
    }

    static entry = async (symbol: string, signal: Signal) => {

        let TE = await TelegramEngine();

        if (!BroadcastEngine.occurrences[symbol]) {
            BroadcastEngine.occurrences[symbol] = new Occurrence(signal.long);
        }

        else {
            BroadcastEngine.occurrences[symbol].update(signal.long);
        }

        // update recent signals
        BroadcastEngine.recentSignals.push(signal.long ? 'long' : 'short');
        if (BroadcastEngine.recentSignals.length > Site.DC_MAX_LATEST_SIGNALS) {
            BroadcastEngine.recentSignals = BroadcastEngine.recentSignals.slice(BroadcastEngine.recentSignals.length - Site.DC_MAX_LATEST_SIGNALS);
        }

        const occurence = BroadcastEngine.occurrences[symbol].getCount();
        let m = `📣 *Signal Broadcast*\n\n`;
        m += `Pair 💲 ${symbol}\n`;
        m += `Type 👉 ${signal.long ? "Long" : "Short"}\n`;
        m += `Description 💬 ${signal.description}\n`;
        const volPricePerc = (signal.volatilityPerc / 100) * signal.markPrice;
        const volPrice = signal.long ? (signal.markPrice + volPricePerc) : (signal.markPrice - volPricePerc);
        m += `Mark Price 🏷️ ${FFF(signal.markPrice, 6)}\n`;
        m += `ATR Limit Price 🏷️ ${FFF(volPrice, 6)}\n`;
        m += `Stop Loss Price 🏷️ ${FFF(signal.tpsl, 6)}\n`;
        m += `Volatility 📈 ${FFF(signal.volatilityPerc)}%\n`;
        m += `Occurrence 🔄 ${formatNumber(occurence)}`;

        const verdict = await BroadcastEngine.computePrompt(symbol, signal, occurence);

        if (verdict) {
            m += `\n\n🤖 AI Verdict\n\`\`\`\n${verdict.str}\`\`\``;
        }

        let inline: TelegramBot.InlineKeyboardButton[][] = [
            [
                {
                    text: `Get Mark Price`,
                    callback_data: `price_${symbol}`,
                }
            ],
            
        ];

        (await TelegramEngine()).sendMessage(m, mid => {
        }, {
            parse_mode: "MarkdownV2",
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: inline,
            }
        });
    }
}