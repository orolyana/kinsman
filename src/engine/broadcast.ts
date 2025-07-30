import TelegramBot from "node-telegram-bot-api";
import { getTimeElapsed } from "../lib/date_time";
import { FFF, formatNumber } from "../lib/format_number";
import { Log } from "../lib/log";
import { Occurrence } from "../model/occurence";
import { Signal } from "../model/signal";
import { Site } from "../site";
import { GroqEngine } from "./groq";
import { GDELTEngine } from "./gdelt";
import { getForexInsights } from "../lib/get_forex_insight";

let cachedTelegramEngine: typeof import('./telegram').TelegramEngine | null = null;
const TelegramEngine = async () => {
    if (!cachedTelegramEngine) {
        cachedTelegramEngine = ((await import('./telegram'))).TelegramEngine;
    }
    return cachedTelegramEngine;
}

let cachedSDSI: typeof import('./sdsi').SDSI | null = null;
const SDSI = async () => {
    if (!cachedSDSI) {
        cachedSDSI = ((await import('./sdsi'))).SDSI;
    }
    return cachedSDSI;
}

let cachedPairEngine: typeof import('./pair').PairEngine | null = null;
const PairEngine = async () => {
    if (!cachedPairEngine) {
        cachedPairEngine = ((await import('./pair'))).PairEngine;
    }
    return cachedPairEngine;
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
        return new Promise<{ str: string, obj: { supported: boolean, reason: string, confidence: number, headlines: string[][] } } | null>(async (resolve, reject) => {
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
            prompt[0].content += `\n\n{\n\t"supported": boolean,\n\t"reason": string,\n\t"confidence": number (0 to 100),\n\t"summary": string (1 paragraph summary verdict of the news summaries provided, combined, strictly less than 500 characters, independent of the signal or other data, with references to your verdict.)\n}`;
            prompt[0].content += `\n\nExample:\n{\n\t"supported": true,\n\t"reason": "ADX confirms strong trend and no reversal signs, supporting the short signal.",\n\t"confidence": 84,\n\t"summary": "The news suggest AUD is bearish while USD is bullish because... "\n}\n\nNote: Numeric values in parentheses (e.g., 14 or 9/26/52/26) beside indicators represent their parameters when applicable, .`;

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

            const base = symbol.slice(0, 3);
            const quote = symbol.slice(3, 6);
            const [baseH, quoteH] = await Promise.all([
                GDELTEngine.fetch(base),
                GDELTEngine.fetch(quote),
            ]);
            if (baseH.length > 0 || quoteH.length > 0) {
                prompt[1].content += `\n\nRecent News Summaries (last 24h):\n`;

                if (baseH.length > 0) {
                    prompt[1].content += `\n[${base}]\n` + baseH.map(h => `- [${h.date}] ${h.summary}`).join("\n");
                }

                if (quoteH.length > 0) {
                    prompt[1].content += `${prompt[1].content.endsWith("\n") ? "" : "\n"}\n[${quote}]\n` + quoteH.map(h => `- [${h.date}] ${h.title}`).join("\n");
                }
            }

            prompt[1].content += `\n\n## TASK\nReturn a JSON object only with:\n- supported: true/false\n- reason: short paragraph\n- confidence: 0–100\n- summary: news verdict summary short paragraph`;

            prompt[0].content = prompt[0].content.replace(/ {2,}/g, " ");
            prompt[1].content = prompt[1].content.replace(/ {2,}/g, " ");

            if (process.env.COLLER) console.log(prompt);

            GroqEngine.request({
                messages: prompt as any,
                callback(r) {
                    if (r.succ) {
                        try {
                            r.message = r.message.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
                            const { supported, reason, confidence, summary } = JSON.parse(r.message);
                            const row = { ts: Date.now(), supported: supported, confidence: confidence, long: signal.long, price: signal.markPrice };

                            BroadcastEngine.aiHistory[symbol].push(row);
                            if (BroadcastEngine.aiHistory[symbol].length > Site.GROQ_MAX_HISTORY_COUNT) {
                                BroadcastEngine.aiHistory[symbol] = BroadcastEngine.aiHistory[symbol].slice(BroadcastEngine.aiHistory[symbol].length - Site.GROQ_MAX_HISTORY_COUNT);
                            }
                            resolve({
                                str: `SUPPORTED: ${supported ? 'Yes' : 'No'}\nCONFIDENCE: ${confidence}\n\nREASON\n${reason}\n\nNEWS\n${summary}`,
                                obj: {
                                    confidence: confidence,
                                    reason: reason,
                                    supported: supported,
                                    headlines: summary,
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

        (await SDSI()).newSignalMonitor(symbol, signal);

        const sdsiOUT = (await SDSI()).getPairAnalysis(symbol);

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
        const firstOccTS = BroadcastEngine.occurrences[symbol].getTimeSinceFirst();
        const tpMargin = Math.abs(signal.markPrice - signal.tpsl) * Site.PE_TP_SL_MULTIPLIER;
        const tpPrice = signal.long ? (signal.markPrice + tpMargin) : (signal.markPrice - tpMargin);
        let m = `📣 *Signal Broadcast*\n\n`;
        m += `Pair 💲 \`${symbol}\`\n`;
        m += `Type 👉 ${signal.long ? "Long" : "Short"}\n`;
        m += `Description 💬 ${signal.description}\n`;
        const volPricePerc = (signal.volatilityPerc / 100) * signal.markPrice;
        const volPrice = signal.long ? (signal.markPrice + volPricePerc) : (signal.markPrice - volPricePerc);
        m += `Mark Price 🏷️ \`${FFF(signal.markPrice, 6)}\`\n`;
        m += `ATR Limit Price 🏷️ \`${FFF(volPrice, 6)}\`\n`;
        m += `SL Price 🏷️ \`${FFF(signal.tpsl, 6)}\`\n`;
        m += `TP Price x${Site.PE_TP_SL_MULTIPLIER} 🏷️ \`${FFF(tpPrice, 6)}\`\n`;
        m += `Volatility 📈 ${FFF(signal.volatilityPerc)}%\n`;
        m += `Occurrence 🔄 ${formatNumber(occurence)} \\(${getTimeElapsed(firstOccTS, Date.now())} ago\\)\n`;
        const pair = (await PairEngine()).getPair(symbol);
        if (pair) {
            if (pair.fiftyTwoWeekHigh && pair.fiftyTwoWeekLow) {
                m += `52 Week ⬆️ \`${FFF(pair.fiftyTwoWeekHigh, 6)}\` ⬇️ \`${FFF(pair.fiftyTwoWeekLow, 6)}\`\n`;
            }
            if (pair.regularMarketDayHigh && pair.regularMarketDayLow && pair.regularMarketPrice) {
                m += `Regulars ⏺️ Day ⬆️ \`${FFF(pair.regularMarketDayHigh, 6)}\` | Day ⬇️ \`${FFF(pair.regularMarketDayLow, 6)}\` | 🏷️ \`${FFF(pair.regularMarketPrice, 6)}\` | 📦 \`${FFF(pair.regularMarketVolume, 6)}\`\n`;
            }
        }

        const verdict = await BroadcastEngine.computePrompt(symbol, signal, occurence);

        if (verdict) {
            m += `\n\n🤖 Verdict\n\`\`\`\n${verdict.str}\`\`\``;
            // const TOTAL_MESSAGE_LENGTH = 4090;
            // const LENGTH_LEFT = TOTAL_MESSAGE_LENGTH - m.length;
            // const MAX_LENGTH_HPT = Math.floor((LENGTH_LEFT - 75) / 2);
            // const BASE_HEADLINES = verdict.obj.headlines[0];
            // const QUOTE_HEADLINES = verdict.obj.headlines[1];
            // if (LENGTH_LEFT > 75 && (BASE_HEADLINES.length + QUOTE_HEADLINES.length) > 0) {
            //     m += `\n\n📰 Headlines\n\`\`\`\n`
            //     // FOR BASE CURRENCY
            //     if (BASE_HEADLINES.length > 0) {
            //         let base = symbol.slice(0, 3);
            //         m += `${base}:\n`;
            //         let notFilled: boolean = true;
            //         let indexBase = 0;
            //         let baseAccumulatedLength: number = 0;
            //         while (indexBase < BASE_HEADLINES.length && notFilled) {
            //             let line = BASE_HEADLINES[indexBase];
            //             let potenLength = baseAccumulatedLength + line.length;
            //             if (potenLength >= (MAX_LENGTH_HPT)) {
            //                 notFilled = false;
            //             }
            //             else {
            //                 m += line;
            //                 baseAccumulatedLength += line.length;
            //             }
            //             indexBase++;
            //         }
            //     }

            //     // FOR QUOTE CURRENCY
            //     // let LL_AGAIN = TOTAL_MESSAGE_LENGTH - m.length;
            //     if (QUOTE_HEADLINES.length > 0) {
            //         let quote = symbol.slice(3, 6);
            //         m += `${quote}:\n`;
            //         let indexQuote = 0;
            //         let notFilled: boolean = true;
            //         while (indexQuote < QUOTE_HEADLINES.length && notFilled) {
            //             let line = QUOTE_HEADLINES[indexQuote];
            //             notFilled = (m.length + line.length) < TOTAL_MESSAGE_LENGTH;
            //             if (notFilled) {
            //                 m += line;
            //             }
            //             indexQuote++;
            //         }
            //     }

            //     m += `\`\`\``;
            // }
        }

        if (sdsiOUT) {
            m += `\n\n🔍 SDSI\n\`\`\`\n${sdsiOUT}\`\`\``;
        }

        m += `\n\n💹 Market Insight\n\`\`\`\n${getForexInsights(symbol)}\`\`\``;

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