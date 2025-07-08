import axios from "axios";
import { getTimeElapsed } from "../lib/date_time";
import { Log } from "../lib/log";
import { Site } from "../site";
import { Candlestick } from "./candlestick";
import { GRes, Res } from "../lib/res";
import { sleep } from "groq-sdk/core";
import { APIResponse, FetchResponse } from "./api_response";
import { AnalysisEngine } from "../engine/analysis";

let LAST_FETCHED_ALL = 0;

export const fetchCSData = (symbol: string, isNew: boolean = true) => new Promise<Res>(async (resolve, reject) => {
    let elapsed = Date.now() - LAST_FETCHED_ALL;
    if (elapsed <= 1000) {
        await sleep(1000 - elapsed);
    }
    const interval = getTimeElapsed(0, Site.PE_INTERVAL_MS).split(" ")[0];
    const range = getTimeElapsed(0, Math.max(1200000, (isNew ? (Site.PE_INTERVAL_MS * Site.PE_MAX_RECORDS) : Site.PE_INTERVAL_MS) * 2)).split(" ")[0];
    axios.get(`${Site.PE_SOURCE_URL}/${symbol}?interval=${interval}&range=${range}`, {
        timeout: Site.PE_DATA_TIMEOUT_MS,
    }).then(r => {
        LAST_FETCHED_ALL = Date.now();
        if (r.status == 200 && r.data && r.data.chart && r.data.chart.result && Array.isArray(r.data.chart.result) && r.data.chart.result.length > 0) {
            const res: APIResponse = r.data.chart.result[0];
            let rowsRemaining = isNew ? Site.PE_MAX_RECORDS : 1;
            let currentID = (res.timestamp || []).length - 1;
            let data: Candlestick[] = [];
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
                    })
                    rowsRemaining--;
                }
                currentID--;
            }
            const rr: FetchResponse = {
                candlestick: data,
                fiftyTwoWeekHigh: res.meta.fiftyTwoWeekHigh,
                fiftyTwoWeekLow: res.meta.fiftyTwoWeekLow,
                fullExchangeName: res.meta.fullExchangeName,
                regularMarketDayHigh: res.meta.regularMarketDayHigh,
                regularMarketDayLow: res.meta.regularMarketDayLow,
                regularMarketPrice: res.meta.regularMarketPrice,
                regularMarketVolume: res.meta.regularMarketVolume,
            }
            if (data.length > 0) {
                resolve(GRes.succ(rr));
            }
            else {
                resolve(GRes.err("No data."));
            }
        }
        else {
            resolve(GRes.err("Unknown response."));
        }
    }).catch(err => {
        LAST_FETCHED_ALL = Date.now();
        resolve(GRes.err(err.message || err.response.data.chart.error || "Connection error."));
    });
});

export class Pair {
    symbol!: string;
    fullExchangeName!: string;
    regularMarketPrice!: number;
    fiftyTwoWeekHigh!: number;
    fiftyTwoWeekLow!: number;
    regularMarketDayHigh!: number;
    regularMarketDayLow!: number;
    regularMarketVolume!: number;
    dataTimeoutObject?: NodeJS.Timeout | null;
    candlestickData!: Candlestick[];
    lastFetched!: number;

    getMarkPrice() {
        if (this.candlestickData.length <= 0) {
            return 0;
        }
        return this.candlestickData[this.candlestickData.length - 1].close;
    }

    async fetchCandlestickData() {
        this.lastFetched = Date.now();
        const conclude = () => {
            const now = Date.now();
            const scheduledTS = this.lastFetched + Site.PE_INTERVAL_MS;
            if (now >= scheduledTS) {
                this.fetchCandlestickData();
            }
            else {
                const timeToSchedule = scheduledTS - now;
                Log.flow([this.symbol, "Candlestick", `Next iteration in ${getTimeElapsed(now, scheduledTS)}.`], 5);
                if (this.dataTimeoutObject) {
                    clearTimeout(this.dataTimeoutObject);
                }
                this.dataTimeoutObject = setTimeout(() => {
                    this.fetchCandlestickData();
                }, timeToSchedule);
            }
        }
        Log.flow([this.symbol, "Candlestick", `Initialized.`], 5);
        const data = await fetchCSData(this.symbol, this.candlestickData.length == 0);
        if (data.succ) {
            const d: FetchResponse = data.message;
            this.candlestickData = this.candlestickData.concat(d.candlestick);
            this.fiftyTwoWeekHigh = d.fiftyTwoWeekHigh;
            this.fiftyTwoWeekLow = d.fiftyTwoWeekLow;
            this.fullExchangeName = d.fullExchangeName;
            this.regularMarketDayHigh = d.regularMarketDayHigh;
            this.regularMarketDayLow = d.regularMarketDayLow;
            this.regularMarketPrice = d.regularMarketPrice;
            this.regularMarketVolume = d.regularMarketVolume;
            if (this.candlestickData.length > Site.PE_MAX_RECORDS) {
                this.candlestickData = this.candlestickData.slice(this.candlestickData.length - Site.PE_MAX_RECORDS);
            }
            const l = d.candlestick.length;
            Log.flow([this.symbol, "Candlestick", `Fetched  ${l} row${l == 1 ? '' : 's'}.`], 5);
            const sig = await AnalysisEngine.run(this.symbol, this.candlestickData);
            if(sig){
                // TODO: Attach broadcast engine here
            }
            conclude();
        }
        else {
            Log.flow([this.symbol, "Candlestick", `Error`, data.message], 5);
            this.candlestickData = [];
            conclude();
        }
    }

    destroy() {
        return new Promise((resolve, reject) => {
            if (this.dataTimeoutObject) {
                clearTimeout(this.dataTimeoutObject);
            }
            resolve(true);
        });
    }

    constructor(symbol: string) {
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