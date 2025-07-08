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
exports.GDELTEngine = void 0;
const axios_1 = __importDefault(require("axios"));
const currencies_1 = require("../data/currencies");
const log_1 = require("../lib/log");
const date_time_1 = require("../lib/date_time");
function toEpochMs(input) {
    const iso = input.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, "$1-$2-$3T$4:$5:$6Z");
    return new Date(iso).getTime();
}
const FINANCIAL_KEYWORDS = [
    "exchange rate", "currency", "inflation", "interest", "central bank",
    "rate decision", "monetary policy", "GDP", "economic", "price", "forecast",
    "bond", "fiscal", "FX", "forex", "reserve", "market", "policy", "devaluation", "rebound", "rise", "fall"
];
const IRRELEVANT_KEYWORDS = ["travel", "tourism", "weather", "fashion", "culture", "recipe", "sports", "celebrity"];
class GDELTEngine {
}
exports.GDELTEngine = GDELTEngine;
_a = GDELTEngine;
GDELTEngine.fetch = (cur) => new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
    if (!currencies_1.currencies[cur])
        return resolve([]);
    const c = currencies_1.currencies[cur];
    const query = `("${c.fullCurrencyName}" OR ${cur} currency)`;
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}+sourcelang:english&mode=artlist&format=json&maxrecords=50&timespan=1d`;
    try {
        const res = yield axios_1.default.get(url, { timeout: 60000 });
        const seen = new Set();
        const articles = (res.data.articles || [])
            .map((art) => ({
            title: art.title.trim(),
            ts: toEpochMs(art.seendate),
            date: (0, date_time_1.getDateTime2)(toEpochMs(art.seendate))
        })).
            filter((x) => {
            const t = x.title.toLowerCase();
            const matchesCurrency = (t.includes(cur.toLowerCase()) ||
                t.includes(c.fullCurrencyName.toLowerCase().split(" ")[0]));
            const hasFinanceContext = FINANCIAL_KEYWORDS.some(kw => t.includes(kw));
            const hasIrrelevantContext = IRRELEVANT_KEYWORDS.some(kw => t.includes(kw));
            const isLongEnough = x.title.length >= 25;
            if (!matchesCurrency || !hasFinanceContext || hasIrrelevantContext || !isLongEnough || seen.has(t)) {
                return false;
            }
            seen.add(t);
            return true;
        })
            .sort((a, b) => b.ts - a.ts);
        resolve(articles);
    }
    catch (error) {
        log_1.Log.dev(error);
        resolve([]);
    }
}));
