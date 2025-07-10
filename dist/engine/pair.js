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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PairEngine = void 0;
const axios_1 = __importDefault(require("axios"));
const log_1 = require("../lib/log");
const regex_1 = require("../lib/regex");
const pair_1 = require("../model/pair");
const site_1 = require("../site");
const res_1 = require("../lib/res");
const ws_1 = require("./ws");
let cachedAnalysisEngine = null;
const AnalysisEngine = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!cachedAnalysisEngine) {
        cachedAnalysisEngine = ((yield Promise.resolve().then(() => __importStar(require('./analysis'))))).AnalysisEngine;
    }
    return cachedAnalysisEngine;
});
class PairEngine {
}
exports.PairEngine = PairEngine;
_a = PairEngine;
PairEngine.slug = "Pair Engine";
PairEngine.pairs = {};
PairEngine.getPair = (symbol) => _a.pairs[symbol];
PairEngine.getPairsLength = () => Object.keys(_a.pairs).length;
PairEngine.getAllPairs = () => Object.keys(_a.pairs).map(x => _a.pairs[x]);
PairEngine.validatePair = (pair) => new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
    const validR = regex_1.RegexPatterns.pair.test(pair);
    if (!validR) {
        resolve(false);
    }
    else {
        if (!site_1.Site.PRODUCTION) {
            resolve(true);
        }
        else {
            const url = `${site_1.Site.PE_SOURCE_URL}/${pair}?interval=1m&range=1d`;
            try {
                const res = yield axios_1.default.get(url, {
                    timeout: site_1.Site.PE_DATA_TIMEOUT_MS,
                });
                const closes = res.data.chart.result[0].indicators.quote[0].close;
                const latestClose = closes[closes.length - 1];
                resolve(true);
            }
            catch (error) {
                log_1.Log.dev(error);
                resolve(false);
            }
        }
    }
}));
PairEngine.deletePair = (symbol) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        if (_a.pairs[symbol]) {
            log_1.Log.flow([_a.slug, "Delete", `${symbol}.`], 2);
            const destroyed = yield _a.pairs[symbol].destroy();
            if (destroyed) {
                delete _a.pairs[symbol];
                log_1.Log.flow([_a.slug, "Delete", `${symbol}`, "Successful."], 2);
                (yield AnalysisEngine()).removePair(symbol);
                ws_1.WSEngine.unsubscribe(symbol);
                resolve(true);
            }
            else {
                log_1.Log.flow([_a.slug, "Delete", `${symbol}`, "Error", "Pair could not be destroyed."], 2);
                resolve(false);
            }
        }
        else {
            resolve(false);
        }
    }));
};
PairEngine.updateMarkPrice = (symbol, price) => {
    if (_a.pairs[symbol]) {
        _a.pairs[symbol].liveMarkPrice = price;
    }
};
PairEngine.addPair = (symbol) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        log_1.Log.flow([_a.slug, "Add", `${symbol}.`], 2);
        if (_a.pairs[symbol]) {
            log_1.Log.flow([_a.slug, "Add", `${symbol}`, "Error", "Pair already exists."], 2);
            resolve(res_1.GRes.err("Pair already exists."));
        }
        else {
            const valid = yield _a.validatePair(symbol);
            if (valid) {
                log_1.Log.flow([_a.slug, "Add", `${symbol}`, "Added successfully."], 2);
                _a.pairs[symbol] = new pair_1.Pair(symbol);
                ws_1.WSEngine.subscribe(symbol);
                resolve(res_1.GRes.succ(`${symbol} added to pairs`));
            }
            else {
                log_1.Log.flow([_a.slug, "Add", `${symbol}`, "Error", "Pair is not valid."], 2);
                resolve(res_1.GRes.err(`${symbol} is not valid.`));
            }
        }
    }));
};
PairEngine.start = () => new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
    log_1.Log.flow([_a.slug, 'Initialized.'], 0);
    for (let i = 0; i < site_1.Site.PE_INITIAL_PAIRS.length; i++) {
        yield _a.addPair(site_1.Site.PE_INITIAL_PAIRS[i]);
    }
    resolve(true);
}));
PairEngine.stop = () => new Promise((resolve, reject) => {
    resolve(true);
});
