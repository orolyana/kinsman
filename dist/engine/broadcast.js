"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastEngine = void 0;
const date_time_1 = require("../lib/date_time");
const format_number_1 = require("../lib/format_number");
const log_1 = require("../lib/log");
const occurence_1 = require("../model/occurence");
const site_1 = require("../site");
const groq_1 = require("./groq");
let cachedTelegramEngine = null;
const TelegramEngine = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!cachedTelegramEngine) {
        cachedTelegramEngine = ((yield Promise.resolve().then(() => __importStar(require('./telegram'))))).TelegramEngine;
    }
    return cachedTelegramEngine;
});
let cachedPairEngine = null;
const PairEngine = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!cachedPairEngine) {
        cachedPairEngine = ((yield Promise.resolve().then(() => __importStar(require('./pair'))))).PairEngine;
    }
    return cachedPairEngine;
});
class BroadcastEngine {
}
exports.BroadcastEngine = BroadcastEngine;
_a = BroadcastEngine;
BroadcastEngine.occurrences = {};
BroadcastEngine.recentSignals = [];
BroadcastEngine.getDominantSignal = () => {
    if (_a.recentSignals.length > 2) {
        const longPerc = (_a.recentSignals.filter(x => x == "long").length / _a.recentSignals.length) * 100;
        const shortPerc = (_a.recentSignals.filter(x => x == "short").length / _a.recentSignals.length) * 100;
        if (longPerc >= site_1.Site.DC_MIN_DOM_PERC && shortPerc < site_1.Site.DC_MIN_DOM_PERC) {
            return "long";
        }
        if (shortPerc >= site_1.Site.DC_MIN_DOM_PERC && longPerc < site_1.Site.DC_MIN_DOM_PERC) {
            return "short";
        }
    }
    return 'no_signal';
};
BroadcastEngine.aiHistory = {};
BroadcastEngine.computePrompt = (symbol, signal, occurence) => {
    return new Promise((resolve, reject) => {
        if (!_a.aiHistory[symbol]) {
            _a.aiHistory[symbol] = [];
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
        prompt[0].content += `You are ${site_1.Site.TITLE || "Bennie"} AI,  a trading assistant skilled in indicator-based strategy evaluation for Forex Futures.`;
        prompt[0].content += `\n\nGiven structured data and recent signal history, determine if the proposed signal is valid.`;
        prompt[0].content += `\n\nRespond ONLY with a JSON object like:`;
        prompt[0].content += `\n\n{\n\t"supported": boolean,\n\t"reason": string,\n\t"confidence": number (0 to 100)\n}`;
        prompt[0].content += `\n\nExample:\n{\n\t"supported": true,\n\t"reason": "ADX confirms strong trend and no reversal signs, supporting the short signal.",\n\t"confidence": 84\n}\n\nNote: Numeric values in parentheses (e.g., 14 or 9/26/52/26) beside indicators represent their parameters when applicable.`;
        prompt[1].content += `# INPUT\n${signal.cachedPrompt[0].join("\n")}`;
        const history = _a.aiHistory[symbol];
        if (history.length > 0) {
            prompt[1].content += `\n\nPrevious Signals:\n` +
                history.map(row => `- ${row.long ? "LONG" : "SHORT"} | ${(0, date_time_1.getTimeElapsed)(row.ts, Date.now())} ago | ${row.price} | ${row.supported ? "✓" : "✗"} ${row.confidence}%`).join("\n");
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
        if (process.env.COLLER)
            console.log(prompt);
        groq_1.GroqEngine.request({
            messages: prompt,
            callback(r) {
                if (r.succ) {
                    try {
                        r.message = r.message.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
                        const { supported, reason, confidence } = JSON.parse(r.message);
                        const row = { ts: Date.now(), supported: supported, confidence: confidence, long: signal.long, price: signal.markPrice };
                        _a.aiHistory[symbol].push(row);
                        if (_a.aiHistory[symbol].length > site_1.Site.GROQ_MAX_HISTORY_COUNT) {
                            _a.aiHistory[symbol] = _a.aiHistory[symbol].slice(_a.aiHistory[symbol].length - site_1.Site.GROQ_MAX_HISTORY_COUNT);
                        }
                        resolve({
                            str: `Supported: ${supported ? 'Yes' : 'No'}\nReason: ${reason}\nConfidence: ${confidence}`,
                            obj: {
                                confidence: confidence,
                                reason: reason,
                                supported: supported,
                            }
                        });
                    }
                    catch (error) {
                        log_1.Log.dev(error);
                        resolve(null);
                    }
                }
                else {
                    resolve(null);
                }
            },
        });
    });
};
BroadcastEngine.entry = (symbol, signal) => __awaiter(void 0, void 0, void 0, function* () {
    let TE = yield TelegramEngine();
    if (!_a.occurrences[symbol]) {
        _a.occurrences[symbol] = new occurence_1.Occurrence(signal.long);
    }
    else {
        _a.occurrences[symbol].update(signal.long);
    }
    // update recent signals
    _a.recentSignals.push(signal.long ? 'long' : 'short');
    if (_a.recentSignals.length > site_1.Site.DC_MAX_LATEST_SIGNALS) {
        _a.recentSignals = _a.recentSignals.slice(_a.recentSignals.length - site_1.Site.DC_MAX_LATEST_SIGNALS);
    }
    const occurence = _a.occurrences[symbol].getCount();
    let m = `📣 *Signal Broadcast*\n\n`;
    m += `Pair 💲 ${symbol}\n`;
    m += `Type 👉 ${signal.long ? "Long" : "Short"}\n`;
    m += `Description 💬 ${signal.description}\n`;
    const volPricePerc = (signal.volatilityPerc / 100) * signal.markPrice;
    const volPrice = signal.long ? (signal.markPrice + volPricePerc) : (signal.markPrice - volPricePerc);
    m += `Mark Price 🏷️ ${(0, format_number_1.FFF)(signal.markPrice, 6)}\n`;
    m += `ATR Limit Price 🏷️ ${(0, format_number_1.FFF)(volPrice, 6)}\n`;
    m += `Stop Loss Price 🏷️ ${(0, format_number_1.FFF)(signal.tpsl, 6)}\n`;
    m += `Volatility 📈 ${(0, format_number_1.FFF)(signal.volatilityPerc)}%\n`;
    m += `Occurrence 🔄 ${(0, format_number_1.formatNumber)(occurence)}\n`;
    const pair = (yield PairEngine()).getPair(symbol);
    if (pair) {
        if (pair.fiftyTwoWeekHigh && pair.fiftyTwoWeekLow) {
            m += `52 Week ⬆️ ${(0, format_number_1.FFF)(pair.fiftyTwoWeekHigh, 6)} ⬇️ ${(0, format_number_1.FFF)(pair.fiftyTwoWeekLow, 6)}\n`;
        }
        if (pair.regularMarketDayHigh && pair.regularMarketDayLow && pair.regularMarketPrice) {
            m += `Regulars ⏺️ Day ⬆️ ${(0, format_number_1.FFF)(pair.regularMarketDayHigh, 6)} | Day ⬇️ ${(0, format_number_1.FFF)(pair.regularMarketDayLow, 6)} | 🏷️ ${(0, format_number_1.FFF)(pair.regularMarketPrice, 6)} | 📦 ${(0, format_number_1.FFF)(pair.regularMarketVolume, 6)}\n`;
        }
    }
    const verdict = yield _a.computePrompt(symbol, signal, occurence);
    if (verdict) {
        m += `\n\n🤖 AI Verdict\n\`\`\`\n${verdict.str}\`\`\``;
    }
    let inline = [
        [
            {
                text: `Get Mark Price`,
                callback_data: `price_${symbol}`,
            }
        ],
    ];
    (yield TelegramEngine()).sendMessage(m, mid => {
    }, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: inline,
        }
    });
});
