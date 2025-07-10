import axios from "axios";
import { Log } from "../lib/log";
import { RegexPatterns } from "../lib/regex";
import { Pair } from "../model/pair";
import { Site } from "../site";
import { GRes, Res } from "../lib/res";
import { WSEngine } from "./ws";

let cachedAnalysisEngine: typeof import('./analysis').AnalysisEngine | null = null;
const AnalysisEngine = async () => {
    if (!cachedAnalysisEngine) {
        cachedAnalysisEngine = ((await import('./analysis'))).AnalysisEngine;
    }
    return cachedAnalysisEngine;
}

export class PairEngine {

    private static slug = "Pair Engine";

    private static pairs: Record<string, Pair> = {};

    static getPair = (symbol: string) => PairEngine.pairs[symbol];

    static getPairsLength = () => Object.keys(PairEngine.pairs).length;

    static getAllPairs = () => Object.keys(PairEngine.pairs).map(x => PairEngine.pairs[x]);

    static validatePair = (pair: string) => new Promise<boolean>(async (resolve, reject) => {
        const validR = RegexPatterns.pair.test(pair);
        if (!validR) {
            resolve(false);
        }
        else {
            if (!Site.PRODUCTION) {
                resolve(true);
            }
            else {
                const url = `${Site.PE_SOURCE_URL}/${pair}?interval=1m&range=1d`;
                try {
                    const res = await axios.get(url, {
                        timeout: Site.PE_DATA_TIMEOUT_MS,
                    });
                    const closes = res.data.chart.result[0].indicators.quote[0].close;
                    const latestClose = closes[closes.length - 1];
                    resolve(true);
                } catch (error) {
                    Log.dev(error);
                    resolve(false);
                }
            }
        }
    });

    static deletePair = (symbol: string) => {
        return new Promise<boolean>(async (resolve, reject) => {
            if (PairEngine.pairs[symbol]) {
                Log.flow([PairEngine.slug, "Delete", `${symbol}.`], 2);
                const destroyed = await PairEngine.pairs[symbol].destroy();
                if (destroyed) {
                    delete PairEngine.pairs[symbol];
                    Log.flow([PairEngine.slug, "Delete", `${symbol}`, "Successful."], 2);
                    (await AnalysisEngine()).removePair(symbol);
                    WSEngine.unsubscribe(symbol);
                    resolve(true);
                }
                else {
                    Log.flow([PairEngine.slug, "Delete", `${symbol}`, "Error", "Pair could not be destroyed."], 2);
                    resolve(false);
                }
            }
            else {
                resolve(false);
            }
        })
    };

    static updateMarkPrice = (symbol: string, price: number) => {
        if (PairEngine.pairs[symbol]) {
            PairEngine.pairs[symbol].liveMarkPrice = price;
        }
    }

    static addPair = (symbol: string) => {
        return new Promise<Res>(async (resolve, reject) => {
            Log.flow([PairEngine.slug, "Add", `${symbol}.`], 2);
            if (PairEngine.pairs[symbol]) {
                Log.flow([PairEngine.slug, "Add", `${symbol}`, "Error", "Pair already exists."], 2);
                resolve(GRes.err("Pair already exists."));
            }
            else {
                const valid = await PairEngine.validatePair(symbol);
                if (valid) {
                    Log.flow([PairEngine.slug, "Add", `${symbol}`, "Added successfully."], 2);
                    PairEngine.pairs[symbol] = new Pair(symbol);
                    WSEngine.subscribe(symbol);
                    resolve(GRes.succ(`${symbol} added to pairs`));
                }
                else {
                    Log.flow([PairEngine.slug, "Add", `${symbol}`, "Error", "Pair is not valid."], 2);
                    resolve(GRes.err(`${symbol} is not valid.`));
                }
            }
        });
    }

    static start = () => new Promise<boolean>(async (resolve, reject) => {
        Log.flow([PairEngine.slug, 'Initialized.'], 0);
        for (let i = 0; i < Site.PE_INITIAL_PAIRS.length; i++) {
            await PairEngine.addPair(Site.PE_INITIAL_PAIRS[i]);
        }
        resolve(true);
    });

    static stop = () => new Promise<boolean>((resolve, reject) => {
        resolve(true);
    });
}