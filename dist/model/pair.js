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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pair = exports.fetchCSData = void 0;
const axios_1 = __importDefault(require("axios"));
const date_time_1 = require("../lib/date_time");
const log_1 = require("../lib/log");
const site_1 = require("../site");
const res_1 = require("../lib/res");
const core_1 = require("groq-sdk/core");
const analysis_1 = require("../engine/analysis");
let LAST_FETCHED_ALL = 0;
let cachedBroadcastEngine = null;
const BroadcastEngine = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!cachedBroadcastEngine) {
        cachedBroadcastEngine = ((yield Promise.resolve().then(() => __importStar(require('./../engine/broadcast'))))).BroadcastEngine;
    }
    return cachedBroadcastEngine;
});
const fetchCSData = (symbol, isNew = true) => new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
    let elapsed = Date.now() - LAST_FETCHED_ALL;
    if (elapsed <= 1000) {
        yield (0, core_1.sleep)(1000 - elapsed);
    }
    const interval = (0, date_time_1.getTimeElapsed)(0, site_1.Site.PE_INTERVAL_MS).split(" ")[0];
    const range = (0, date_time_1.getTimeElapsed)(0, Math.max(1200000, (isNew ? (site_1.Site.PE_INTERVAL_MS * site_1.Site.PE_MAX_RECORDS) : site_1.Site.PE_INTERVAL_MS) * 2)).split(" ")[0];
    axios_1.default.get(`${site_1.Site.PE_SOURCE_URL}/${symbol}?interval=${interval}&range=${range}`, {
        timeout: site_1.Site.PE_DATA_TIMEOUT_MS,
    }).then(r => {
        LAST_FETCHED_ALL = Date.now();
        if (r.status == 200 && r.data && r.data.chart && r.data.chart.result && Array.isArray(r.data.chart.result) && r.data.chart.result.length > 0) {
            const res = r.data.chart.result[0];
            let rowsRemaining = isNew ? site_1.Site.PE_MAX_RECORDS : 1;
            let currentID = (res.timestamp || []).length - 1;
            let data = [];
            const src = (res.indicators.quote[0] || []);
            while (rowsRemaining && currentID >= 0) {
                const ts = (res.timestamp[currentID] || 0) * 1000;
                const open = (src.open || [])[currentID] || 0;
                const high = (src.high || [])[currentID] || 0;
                const low = (src.low || [])[currentID] || 0;
                const close = (src.close || [])[currentID] || 0;
                const volume = (src.volume || [])[currentID] || 0;
                if (ts && open && high && low && close) {
                    data.unshift({
                        open, high, low, close, volume, ts,
                    });
                    rowsRemaining--;
                }
                currentID--;
            }
            const rr = {
                candlestick: data,
                fiftyTwoWeekHigh: res.meta.fiftyTwoWeekHigh,
                fiftyTwoWeekLow: res.meta.fiftyTwoWeekLow,
                fullExchangeName: res.meta.fullExchangeName,
                regularMarketDayHigh: res.meta.regularMarketDayHigh,
                regularMarketDayLow: res.meta.regularMarketDayLow,
                regularMarketPrice: res.meta.regularMarketPrice,
                regularMarketVolume: res.meta.regularMarketVolume,
            };
            if (data.length > 0) {
                resolve(res_1.GRes.succ(rr));
            }
            else {
                resolve(res_1.GRes.err("No data."));
            }
        }
        else {
            resolve(res_1.GRes.err("Unknown response."));
        }
    }).catch(err => {
        LAST_FETCHED_ALL = Date.now();
        resolve(res_1.GRes.err(err.message || err.response.data.chart.error || "Connection error."));
    });
}));
exports.fetchCSData = fetchCSData;
class Pair {
    getMarkPrice() {
        if (this.candlestickData.length <= 0) {
            return 0;
        }
        return this.candlestickData[this.candlestickData.length - 1].close;
    }
    fetchCandlestickData() {
        return __awaiter(this, void 0, void 0, function* () {
            this.lastFetched = Date.now();
            const conclude = () => {
                const now = Date.now();
                const scheduledTS = this.lastFetched + site_1.Site.PE_INTERVAL_MS;
                if (now >= scheduledTS) {
                    this.fetchCandlestickData();
                }
                else {
                    const timeToSchedule = scheduledTS - now;
                    log_1.Log.flow([this.symbol, "Candlestick", `Next iteration in ${(0, date_time_1.getTimeElapsed)(now, scheduledTS)}.`], 5);
                    if (this.dataTimeoutObject) {
                        clearTimeout(this.dataTimeoutObject);
                    }
                    this.dataTimeoutObject = setTimeout(() => {
                        this.fetchCandlestickData();
                    }, timeToSchedule);
                }
            };
            log_1.Log.flow([this.symbol, "Candlestick", `Initialized.`], 5);
            const data = yield (0, exports.fetchCSData)(this.symbol, this.candlestickData.length == 0);
            if (data.succ) {
                const d = data.message;
                this.candlestickData = this.candlestickData.concat(d.candlestick);
                this.fiftyTwoWeekHigh = d.fiftyTwoWeekHigh;
                this.fiftyTwoWeekLow = d.fiftyTwoWeekLow;
                this.fullExchangeName = d.fullExchangeName;
                this.regularMarketDayHigh = d.regularMarketDayHigh;
                this.regularMarketDayLow = d.regularMarketDayLow;
                this.regularMarketPrice = d.regularMarketPrice;
                this.regularMarketVolume = d.regularMarketVolume;
                if (this.candlestickData.length > site_1.Site.PE_MAX_RECORDS) {
                    this.candlestickData = this.candlestickData.slice(this.candlestickData.length - site_1.Site.PE_MAX_RECORDS);
                }
                const l = d.candlestick.length;
                log_1.Log.flow([this.symbol, "Candlestick", `Fetched  ${l} row${l == 1 ? '' : 's'}.`], 5);
                const sig = yield analysis_1.AnalysisEngine.run(this.symbol, this.candlestickData);
                if (sig) {
                    (yield BroadcastEngine()).entry(this.symbol, sig);
                }
                conclude();
            }
            else {
                log_1.Log.flow([this.symbol, "Candlestick", `Error`, data.message], 5);
                this.candlestickData = [];
                conclude();
            }
        });
    }
    destroy() {
        return new Promise((resolve, reject) => {
            if (this.dataTimeoutObject) {
                clearTimeout(this.dataTimeoutObject);
            }
            resolve(true);
        });
    }
    constructor(symbol) {
        this.symbol = symbol;
        this.candlestickData = [];
        this.dataTimeoutObject = null;
        this.fiftyTwoWeekHigh = 0;
        this.fiftyTwoWeekLow = 0;
        this.fullExchangeName = "";
        this.lastFetched = 0;
        this.regularMarketDayHigh = 0;
        this.regularMarketDayLow = 0;
        this.regularMarketPrice = 0;
        this.regularMarketVolume = 0;
        this.fetchCandlestickData();
    }
}
exports.Pair = Pair;
