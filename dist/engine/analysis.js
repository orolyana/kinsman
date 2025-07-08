"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisEngine = void 0;
const technicalindicators_1 = require("technicalindicators");
const site_1 = require("../site");
const signal_1 = require("../model/signal");
const log_1 = require("../lib/log");
const date_time_1 = require("../lib/date_time");
const boolean_consolidator_1 = require("../lib/boolean_consolidator");
const format_number_1 = require("../lib/format_number");
class AnalysisEngine {
}
exports.AnalysisEngine = AnalysisEngine;
AnalysisEngine.slug = "Analysis";
/**
 * Holds previous entry values per token for Bullish.
 */
AnalysisEngine.isEntryBull = {};
/**
 * Holds previous entry values per token for Bearish.
 */
AnalysisEngine.isEntryBear = {};
AnalysisEngine.removePair = (symbol) => {
    // delete AnalysisEngine.multilayeredHistory[symbol];
    delete AnalysisEngine.isEntryBear[symbol];
    delete AnalysisEngine.isEntryBull[symbol];
};
AnalysisEngine.stop = () => new Promise((resolve, reject) => {
    resolve(true);
});
AnalysisEngine.getParamsForInd = (ind) => {
    const p = Object.keys(site_1.Site.IN_CFG).filter(x => x.startsWith(ind));
    return p.length ? `(${p.map(x => `${site_1.Site.IN_CFG[x]}`).join("/")})` : '(default params)';
};
AnalysisEngine.lastTS = 0;
AnalysisEngine.run = (symbol, data) => {
    return new Promise((resolve, reject) => {
        log_1.Log.flow([AnalysisEngine.slug, symbol, `Initialized.`], 5);
        if (data.length >= (site_1.Site.IN_CFG.MN_DATA_LEN || 10)) {
            let ts = Date.now();
            if (ts == AnalysisEngine.lastTS) {
                ts = ts + 1;
            }
            AnalysisEngine.lastTS = ts;
            const open = data.map(x => x.open);
            const high = data.map(x => x.high);
            const low = data.map(x => x.low);
            const close = data.map(x => x.close);
            const volume = data.map(x => x.volume);
            const latestRate = close[close.length - 1] || 0;
            const csd = { open, close, high, low };
            let userPrompt = [
                [
                    `Ticker: ${symbol}`,
                    `Data: ${data.length}x${(0, date_time_1.getTimeElapsed)(0, site_1.Site.PE_INTERVAL_MS).split(" ")[0]} (${(0, date_time_1.getDateTime2)(Date.now() - (site_1.Site.PE_INTERVAL_MS * data.length))} → ${(0, date_time_1.getDateTime2)(Date.now())})`,
                    `Price: ${latestRate}`,
                ], // INPUT DATA
                [], // STEP 1
                [], // STEP 2
                [], // STEP 3
                [], // STEP 4
                [], // STEP 5
                [], // STEP 6
                [], // STEP 7
                [], // PREVIOUS ANALYSIS
            ];
            let currentStep = 0;
            let cache = {
                PSR: null,
                PSR_BULL: null,
                PSR_BEAR: null,
                PSR_SL: null,
                MCD: null,
                MCD_BULL: null,
                MCD_BEAR: null,
                ICH: null,
                ICH_BULL: null,
                ICH_BEAR: null,
                ICH_SL: null,
                BLL_BULL: null,
                BLL_BEAR: null,
                KST_BULL: null,
                KST_BEAR: null,
                SMA_BULL: null,
                SMA_BEAR: null,
                EMA_BULL: null,
                EMA_BEAR: null,
                WMA_BULL: null,
                WMA_BEAR: null,
                VWP_BULL: null,
                VWP_BEAR: null,
                AOS_BULL: null,
                AOS_BEAR: null,
                TRX_BULL: null,
                TRX_BEAR: null,
                STRONG: null,
                STC_OB: null,
                STC_OS: null,
                RSI_OB: null,
                RSI_OS: null,
                CCI_OB: null,
                CCI_OS: null,
                MFI_OB: null,
                MFI_OS: null,
                BBS_OB: null,
                BBS_OS: null,
                SRS_OB: null,
                SRS_OS: null,
                SRS_BULL: null,
                SRS_BEAR: null,
                STR: null,
                HGM: null,
                BAR: null,
                EST: null,
                TBC: null,
                PIL: null,
                DCC: null,
                TTP: null,
                TWS: null,
                MST: null,
                HMR: null,
                TBT: null,
                ABB: null,
                BEP: null,
                EDS: null,
                GSD: null,
                BRH: null,
                BRM: null,
                BHC: null,
                BLE: null,
                MDS: null,
                DFD: null,
                BLH: null,
                BLM: null,
                BLC: null,
                ATR: null,
                ENTRY: null,
            };
            const ensureInd = {
                PSR: () => {
                    var _a, _b, _c, _d;
                    if (!cache.PSR) {
                        const psar = technicalindicators_1.PSAR.calculate({ high, low, step: (_a = site_1.Site.IN_CFG.PSR_ST) !== null && _a !== void 0 ? _a : 0.02, max: (_b = site_1.Site.IN_CFG.PSR_MX) !== null && _b !== void 0 ? _b : 0.2 });
                        const psarBull = ((_c = psar[psar.length - 1]) !== null && _c !== void 0 ? _c : latestRate) < latestRate;
                        const psarBear = ((_d = psar[psar.length - 1]) !== null && _d !== void 0 ? _d : latestRate) > latestRate;
                        const sl = psar[psar.length - 1] || 0;
                        cache.PSR = true;
                        cache.PSR_BULL = psarBull;
                        cache.PSR_BEAR = psarBear;
                        cache.PSR_SL = sl;
                    }
                    if (cache.PSR_BULL || cache.PSR_BEAR)
                        userPrompt[currentStep].push(`${currentStep == 6 ? `${cache.PSR_SL} (PSAR)` : ''} ${(currentStep == 1 || (currentStep == 6 && site_1.Site.STR_TSL_IND != site_1.Site.STR_ENTRY_IND)) ? `${AnalysisEngine.getParamsForInd('PSR_').replace("ST", "step").replace("mx", "max") || "default"}` : ''}`);
                },
                MCD: () => {
                    var _a, _b, _c;
                    if (!cache.MCD) {
                        const macd = technicalindicators_1.MACD.calculate({ values: close, fastPeriod: (_a = site_1.Site.IN_CFG.MCD_FSP) !== null && _a !== void 0 ? _a : 12, slowPeriod: (_b = site_1.Site.IN_CFG.MCD_SLP) !== null && _b !== void 0 ? _b : 26, signalPeriod: (_c = site_1.Site.IN_CFG.MCD_SGP) !== null && _c !== void 0 ? _c : 9, SimpleMAOscillator: false, SimpleMASignal: false });
                        const macdBull = macd.length > 0
                            ? ((macd[macd.length - 1].MACD !== undefined || macd[macd.length - 1].MACD === 0) &&
                                (macd[macd.length - 1].signal !== undefined || macd[macd.length - 1].signal === 0))
                                ? macd[macd.length - 1].MACD > macd[macd.length - 1].signal
                                : false
                            : false;
                        const macdBear = macd.length > 0
                            ? ((macd[macd.length - 1].MACD !== undefined || macd[macd.length - 1].MACD === 0) &&
                                (macd[macd.length - 1].signal !== undefined || macd[macd.length - 1].signal === 0))
                                ? macd[macd.length - 1].MACD < macd[macd.length - 1].signal
                                : false
                            : false;
                        cache.MCD = true;
                        cache.MCD_BULL = macdBull;
                        cache.MCD_BEAR = macdBear;
                    }
                    if (cache.MCD_BULL || cache.MCD_BEAR)
                        userPrompt[currentStep].push(`${currentStep == 2 ? `MACD: ${cache.MCD_BULL ? 'Bullish' : cache.MCD_BEAR ? 'Bearish' : 'No Trend'}` : ''} ${(currentStep == 1 || (currentStep == 2 && (!site_1.Site.STR_TREND_IND.includes(site_1.Site.STR_ENTRY_IND)))) ? `${AnalysisEngine.getParamsForInd('MCD_').replace("FSP", "fast period").replace("SLP", "slow period").replace("SGP", "signal period") || "default"}` : ''}`);
                },
                SRS: () => {
                    var _a, _b, _c, _d;
                    if (cache.SRS_OB === null) {
                        const srsi = technicalindicators_1.StochasticRSI.calculate({
                            dPeriod: (_a = site_1.Site.IN_CFG.STC_SP) !== null && _a !== void 0 ? _a : 3,
                            kPeriod: (_b = site_1.Site.IN_CFG.STC_SP) !== null && _b !== void 0 ? _b : 3,
                            rsiPeriod: (_c = site_1.Site.IN_CFG.RSI_P) !== null && _c !== void 0 ? _c : 14,
                            stochasticPeriod: (_d = site_1.Site.IN_CFG.STC_P) !== null && _d !== void 0 ? _d : 14,
                            values: close,
                        });
                        const OB = (((srsi[srsi.length - 1] || {}).stochRSI || 0) > 80) &&
                            (((srsi[srsi.length - 1] || {}).d || 0) > 80) &&
                            (((srsi[srsi.length - 1] || {}).k || 0) > 80);
                        const OS = (((srsi[srsi.length - 1] || {}).stochRSI || 100) < 20) &&
                            (((srsi[srsi.length - 1] || {}).d || 100) < 20) &&
                            (((srsi[srsi.length - 1] || {}).k || 100) < 20);
                        cache.SRS_OB = OB;
                        cache.SRS_OS = OS;
                        cache.SRS_BULL = !OS;
                        cache.SRS_BEAR = !OB;
                    }
                    if ((cache.ENTRY === true && cache.SRS_OB) || (cache.ENTRY === false && cache.SRS_OS))
                        userPrompt[currentStep].push(`STOCH RSI ${(AnalysisEngine.getParamsForInd('STC_').replace("SP", "stoch signal period").replace("P", "stoch period").replace(")", "") + '/' + AnalysisEngine.getParamsForInd('RSI_').replace("P", "rsi period").replace("(", "")) || "default"}`);
                },
                ICH: () => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
                    if (!cache.ICH) {
                        const ichimoku = technicalindicators_1.IchimokuCloud.calculate({
                            high,
                            low,
                            conversionPeriod: (_a = site_1.Site.IN_CFG.ICH_CVP) !== null && _a !== void 0 ? _a : 9,
                            basePeriod: (_b = site_1.Site.IN_CFG.ICH_BSP) !== null && _b !== void 0 ? _b : 26,
                            spanPeriod: (_c = site_1.Site.IN_CFG.ICH_SPP) !== null && _c !== void 0 ? _c : 52,
                            displacement: (_d = site_1.Site.IN_CFG.ICH_DIS) !== null && _d !== void 0 ? _d : 26,
                        });
                        const conversion = (_e = (ichimoku[ichimoku.length - 1] || {}).conversion) !== null && _e !== void 0 ? _e : 0;
                        const base = (_f = (ichimoku[ichimoku.length - 1] || {}).base) !== null && _f !== void 0 ? _f : 0;
                        const spanA = (_g = (ichimoku[ichimoku.length - 1] || {}).spanA) !== null && _g !== void 0 ? _g : 0;
                        const spanB = (_h = (ichimoku[ichimoku.length - 1] || {}).spanB) !== null && _h !== void 0 ? _h : 0;
                        const lag = (_k = close[close.length - ((_j = site_1.Site.IN_CFG.ICH_DIS) !== null && _j !== void 0 ? _j : 26) - 1]) !== null && _k !== void 0 ? _k : 0;
                        const lagSpanA = (_m = (ichimoku[ichimoku.length - 1 - ((_l = site_1.Site.IN_CFG.ICH_DIS) !== null && _l !== void 0 ? _l : 26)] || {}).spanA) !== null && _m !== void 0 ? _m : 0;
                        const lagSpanB = (_p = (ichimoku[ichimoku.length - 1 - ((_o = site_1.Site.IN_CFG.ICH_DIS) !== null && _o !== void 0 ? _o : 26)] || {}).spanB) !== null && _p !== void 0 ? _p : 0;
                        const bull = (latestRate > spanA) && (spanA > spanB) && (conversion > base) && (lag > Math.max(lagSpanA, lagSpanB));
                        const bear = (latestRate < spanA) && (spanA < spanB) && (conversion < base) && (lag < Math.min(lagSpanA, lagSpanB));
                        let sl = spanB;
                        cache.ICH = true;
                        cache.ICH_BULL = bull;
                        cache.ICH_BEAR = bear;
                        cache.ICH_SL = sl;
                    }
                    if (cache.ICH_BULL || cache.ICH_BEAR)
                        userPrompt[currentStep].push(`${currentStep == 6 ? `${cache.ICH_SL} (ICH)` : ''} ${(currentStep == 1 || (currentStep == 6 && site_1.Site.STR_TSL_IND != site_1.Site.STR_ENTRY_IND)) ? `${AnalysisEngine.getParamsForInd('ICH_').replace("CVP", "conversion period").replace("BSP", "base period").replace("SPP", "span period").replace("DIS", "displacement") || "default"}` : ''}`);
                },
                BLL: () => {
                    if (cache.BLL_BULL === null) {
                        cache.BLL_BULL = (0, technicalindicators_1.bullish)(csd);
                        cache.BLL_BEAR = (0, technicalindicators_1.bearish)(csd);
                    }
                    if (cache.BLL_BULL || cache.BLL_BEAR)
                        userPrompt[currentStep].push(`CANDLE: ${cache.BLL_BULL ? 'Bullish' : cache.BLL_BEAR ? 'Bearish' : 'No Trend'}`);
                },
                SMA: () => {
                    var _a;
                    if (cache.SMA_BULL === null) {
                        const ma = technicalindicators_1.SMA.calculate({ values: close, period: (_a = site_1.Site.IN_CFG.MAP) !== null && _a !== void 0 ? _a : 20 });
                        cache.SMA_BULL = latestRate > (ma[ma.length - 1] || Infinity);
                        cache.SMA_BEAR = latestRate < (ma[ma.length - 1] || 0);
                    }
                    if (cache.SMA_BULL || cache.SMA_BEAR)
                        userPrompt[currentStep].push(`SMA: ${cache.SMA_BULL ? 'Bullish' : cache.SMA_BEAR ? 'Bearish' : 'No Trend'} ${AnalysisEngine.getParamsForInd('MAP') ? `${AnalysisEngine.getParamsForInd('MAP')}` : "default"}`);
                },
                KST: () => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                    if (cache.KST_BULL === null) {
                        const kst = technicalindicators_1.KST.calculate({
                            ROCPer1: (_a = site_1.Site.IN_CFG.KST_RP1) !== null && _a !== void 0 ? _a : 10,
                            ROCPer2: (_b = site_1.Site.IN_CFG.KST_RP2) !== null && _b !== void 0 ? _b : 15,
                            ROCPer3: (_c = site_1.Site.IN_CFG.KST_RP3) !== null && _c !== void 0 ? _c : 20,
                            ROCPer4: (_d = site_1.Site.IN_CFG.KST_RP4) !== null && _d !== void 0 ? _d : 30,
                            signalPeriod: (_e = site_1.Site.IN_CFG.KST_SGP) !== null && _e !== void 0 ? _e : 9,
                            SMAROCPer1: (_f = site_1.Site.IN_CFG.KST_SP1) !== null && _f !== void 0 ? _f : 10,
                            SMAROCPer2: (_g = site_1.Site.IN_CFG.KST_SP2) !== null && _g !== void 0 ? _g : 10,
                            SMAROCPer3: (_h = site_1.Site.IN_CFG.KST_SP3) !== null && _h !== void 0 ? _h : 10,
                            SMAROCPer4: (_j = site_1.Site.IN_CFG.KST_SP4) !== null && _j !== void 0 ? _j : 15,
                            values: close,
                        });
                        const bull = (((kst[kst.length - 1] || {}).kst || Number.MIN_VALUE) > ((kst[kst.length - 1] || {}).signal || 0))
                            && (((kst[kst.length - 1] || {}).kst || Number.MIN_VALUE) > 0);
                        const bear = (((kst[kst.length - 1] || {}).kst || Number.MAX_VALUE) < ((kst[kst.length - 1] || {}).signal || 0))
                            && (((kst[kst.length - 1] || {}).kst || Number.MAX_VALUE) < 0);
                        cache.KST_BULL = bull;
                        cache.KST_BEAR = bear;
                    }
                    if (cache.KST_BULL || cache.KST_BEAR)
                        userPrompt[currentStep].push(`KST: ${cache.KST_BULL ? 'Bullish' : cache.KST_BEAR ? 'Bearish' : 'No Trend'} ${AnalysisEngine.getParamsForInd('KST_').replace(/RP/g, "ROC period ").replace(/SG/, "signal period ").replace(/SP/g, "SMA ROC period ") || "default"}`);
                },
                EMA: () => {
                    var _a;
                    if (cache.EMA_BULL === null) {
                        const ma = technicalindicators_1.EMA.calculate({ values: close, period: (_a = site_1.Site.IN_CFG.MAP) !== null && _a !== void 0 ? _a : 20 });
                        cache.EMA_BULL = latestRate > (ma[ma.length - 1] || Infinity);
                        cache.EMA_BEAR = latestRate < (ma[ma.length - 1] || 0);
                    }
                    if (cache.EMA_BULL || cache.EMA_BEAR)
                        userPrompt[currentStep].push(`EMA: ${cache.EMA_BULL ? 'Bullish' : cache.EMA_BEAR ? 'Bearish' : 'No Trend'} ${AnalysisEngine.getParamsForInd('MAP') ? `${AnalysisEngine.getParamsForInd('MAP')}` : "default"}`);
                },
                WMA: () => {
                    var _a;
                    if (cache.WMA_BULL === null) {
                        const ma = technicalindicators_1.WMA.calculate({ values: close, period: (_a = site_1.Site.IN_CFG.MAP) !== null && _a !== void 0 ? _a : 20 });
                        cache.WMA_BULL = latestRate > (ma[ma.length - 1] || Infinity);
                        cache.WMA_BEAR = latestRate < (ma[ma.length - 1] || 0);
                    }
                    if (cache.WMA_BULL || cache.WMA_BEAR)
                        userPrompt[currentStep].push(`WMA: ${cache.WMA_BULL ? 'Bullish' : cache.WMA_BEAR ? 'Bearish' : 'No Trend'} ${AnalysisEngine.getParamsForInd('MAP') ? `${AnalysisEngine.getParamsForInd('MAP')}` : "default"}`);
                },
                VWP: () => {
                    if (cache.VWP_BULL === null) {
                        const vwap = technicalindicators_1.VWAP.calculate({ close, high, low, volume });
                        cache.VWP_BULL = latestRate > (vwap[vwap.length - 1] || Infinity);
                        cache.VWP_BEAR = latestRate < (vwap[vwap.length - 1] || 0);
                    }
                    if (cache.VWP_BULL || cache.VWP_BEAR)
                        userPrompt[currentStep].push(`VWAP: ${cache.VWP_BULL ? 'Bullish' : cache.VWP_BEAR ? 'Bearish' : 'No Trend'}`);
                },
                AOS: () => {
                    var _a, _b;
                    if (cache.AOS_BULL === null) {
                        const ao = technicalindicators_1.AwesomeOscillator.calculate({ high, low, fastPeriod: (_a = site_1.Site.IN_CFG.AOS_FSP) !== null && _a !== void 0 ? _a : 5, slowPeriod: (_b = site_1.Site.IN_CFG.AOS_SLP) !== null && _b !== void 0 ? _b : 34 });
                        cache.AOS_BULL = (ao[ao.length - 1] || 0) > 0;
                        cache.AOS_BEAR = (ao[ao.length - 1] || 0) < 0;
                    }
                    if (cache.AOS_BULL || cache.AOS_BEAR)
                        userPrompt[currentStep].push(`AO: ${cache.AOS_BULL ? 'Bullish' : cache.AOS_BEAR ? 'Bearish' : 'No Trend'} ${AnalysisEngine.getParamsForInd('AOS_').replace("FSP", "fast period").replace("SLP", "slow period") || "default"}`);
                },
                TRX: () => {
                    var _a;
                    if (cache.TRX_BULL === null) {
                        const trix = technicalindicators_1.TRIX.calculate({ values: close, period: (_a = site_1.Site.IN_CFG.TRX_P) !== null && _a !== void 0 ? _a : 15 });
                        cache.TRX_BULL = (trix[trix.length - 1] || 0) > 0;
                        cache.TRX_BEAR = (trix[trix.length - 1] || 0) < 0;
                    }
                    if (cache.TRX_BULL || cache.TRX_BEAR)
                        userPrompt[currentStep].push(`TRIX: ${cache.TRX_BULL ? 'Bullish' : cache.TRX_BEAR ? 'Bearish' : 'No Trend'} ${AnalysisEngine.getParamsForInd('TRX_').replace("P", "period") || "default"}`);
                },
                ADX: () => {
                    var _a;
                    if (cache.STRONG === null) {
                        const adx = technicalindicators_1.ADX.calculate({ close, high, low, period: (_a = site_1.Site.IN_CFG.ADX_P) !== null && _a !== void 0 ? _a : 14 });
                        cache.STRONG = ((adx[adx.length - 1] || {}).adx || 0) >= 25;
                    }
                    userPrompt[currentStep].push(`ADX = ${cache.STRONG ? 'Strong' : 'Not Strong'} ${AnalysisEngine.getParamsForInd('ADX_').replace("P", "period") || "default"}`);
                },
                STC: () => {
                    var _a, _b;
                    if (cache.STC_OB === null) {
                        const stoch = technicalindicators_1.Stochastic.calculate({ close, high, low, period: (_a = site_1.Site.IN_CFG.STC_P) !== null && _a !== void 0 ? _a : 14, signalPeriod: (_b = site_1.Site.IN_CFG.STC_SP) !== null && _b !== void 0 ? _b : 3 });
                        cache.STC_OB = ((stoch[stoch.length - 1] || {}).k || 0) > 80;
                        cache.STC_OS = ((stoch[stoch.length - 1] || {}).k || Infinity) < 20;
                    }
                    if ((cache.ENTRY === true && cache.STC_OB) || (cache.ENTRY === false && cache.STC_OS))
                        userPrompt[currentStep].push(`STOCH ${AnalysisEngine.getParamsForInd('STC_').replace("P", "period").replace("SP", "signal period") || "default"}`);
                },
                RSI: () => {
                    var _a;
                    if (cache.RSI_OB === null) {
                        const rsi = technicalindicators_1.RSI.calculate({ values: close, period: (_a = site_1.Site.IN_CFG.RSI_P) !== null && _a !== void 0 ? _a : 14 });
                        cache.RSI_OB = (rsi[rsi.length - 1] || 0) > 70;
                        cache.RSI_OS = (rsi[rsi.length - 1] || Infinity) < 30;
                    }
                    if ((cache.ENTRY === true && cache.RSI_OB) || (cache.ENTRY === false && cache.RSI_OS))
                        userPrompt[currentStep].push(`RSI ${AnalysisEngine.getParamsForInd('RSI_').replace("P", "period") || "default"}`);
                },
                CCI: () => {
                    var _a;
                    if (cache.CCI_OB === null) {
                        const cci = technicalindicators_1.CCI.calculate({ close, high, low, period: (_a = site_1.Site.IN_CFG.CCI_P) !== null && _a !== void 0 ? _a : 14 });
                        cache.CCI_OB = (cci[cci.length - 1] || 0) > 100;
                        cache.CCI_OB = (cci[cci.length - 1] || Infinity) < -100;
                    }
                    if ((cache.ENTRY === true && cache.CCI_OB) || (cache.ENTRY === false && cache.CCI_OS))
                        userPrompt[currentStep].push(`CCI ${AnalysisEngine.getParamsForInd('CCI_').replace("P", "period") || "default"}`);
                },
                MFI: () => {
                    var _a;
                    if (cache.MFI_OB === null) {
                        const mfi = technicalindicators_1.MFI.calculate({ close, volume, high, low, period: (_a = site_1.Site.IN_CFG.MFI_P) !== null && _a !== void 0 ? _a : 14 });
                        cache.MFI_OB = (mfi[mfi.length - 1] || 0) > 80;
                        cache.MFI_OS = (mfi[mfi.length - 1] || Infinity) < 20;
                    }
                    if ((cache.ENTRY === true && cache.MFI_OB) || (cache.ENTRY === false && cache.MFI_OS))
                        userPrompt[currentStep].push(`MFI ${AnalysisEngine.getParamsForInd('MFI_').replace("P", "period") || "default"}`);
                },
                STR: () => {
                    if (cache.STR === null) {
                        cache.STR = (0, technicalindicators_1.shootingstar)(csd);
                    }
                    if ((cache.ENTRY === true) && cache.STR)
                        userPrompt[currentStep].push(`Shooting Star`);
                },
                HGM: () => {
                    if (cache.HGM === null) {
                        cache.HGM = (0, technicalindicators_1.hangingman)(csd);
                    }
                    if ((cache.ENTRY === true) && cache.HGM)
                        userPrompt[currentStep].push(`Hanging Man`);
                },
                EST: () => {
                    if (cache.EST === null) {
                        cache.EST = (0, technicalindicators_1.eveningstar)(csd);
                    }
                    if ((cache.ENTRY === true) && cache.EST)
                        userPrompt[currentStep].push(`Evening Star`);
                },
                TBC: () => {
                    if (cache.TBC === null) {
                        cache.TBC = (0, technicalindicators_1.threeblackcrows)(csd);
                    }
                    if ((cache.ENTRY === true) && cache.TBC)
                        userPrompt[currentStep].push(`Three Black Crows`);
                },
                PIL: () => {
                    if (cache.PIL === null) {
                        cache.PIL = (0, technicalindicators_1.piercingline)(csd);
                    }
                    if ((cache.ENTRY === true) && cache.PIL)
                        userPrompt[currentStep].push(`Piercing Line`);
                },
                DCC: () => {
                    if (cache.DCC === null) {
                        cache.DCC = (0, technicalindicators_1.darkcloudcover)(csd);
                    }
                    if ((cache.ENTRY === true) && cache.DCC)
                        userPrompt[currentStep].push(`Dark Cloud Cover`);
                },
                TTP: () => {
                    if (cache.TTP === null) {
                        cache.TTP = (0, technicalindicators_1.tweezertop)(csd);
                    }
                    if ((cache.ENTRY === true) && cache.TTP)
                        userPrompt[currentStep].push(`Tweezer Top`);
                },
                TWS: () => {
                    if (cache.TWS === null) {
                        cache.TWS = (0, technicalindicators_1.threewhitesoldiers)(csd);
                    }
                    if ((cache.ENTRY === false) && cache.TWS)
                        userPrompt[currentStep].push(`Three White Soldiers`);
                },
                MST: () => {
                    if (cache.MST === null) {
                        cache.MST = (0, technicalindicators_1.morningstar)(csd);
                    }
                    if ((cache.ENTRY === false) && cache.MST)
                        userPrompt[currentStep].push(`Morning Star`);
                },
                HMR: () => {
                    if (cache.HMR === null) {
                        cache.HMR = (0, technicalindicators_1.hammerpattern)(csd);
                    }
                    if ((cache.ENTRY === false) && cache.HMR)
                        userPrompt[currentStep].push(`Hammer Pattern`);
                },
                TBT: () => {
                    if (cache.TBT === null) {
                        cache.TBT = (0, technicalindicators_1.tweezerbottom)(csd);
                    }
                    if ((cache.ENTRY === false) && cache.TBT)
                        userPrompt[currentStep].push(`Tweezer Bottom`);
                },
                ABB: () => {
                    if (cache.ABB === null) {
                        cache.ABB = (0, technicalindicators_1.abandonedbaby)(csd);
                    }
                    if (cache.ABB)
                        userPrompt[currentStep].push(`Abandoned Baby`);
                },
                BLE: () => {
                    if (cache.BLE === null) {
                        cache.BLE = (0, technicalindicators_1.bullishengulfingpattern)(csd);
                    }
                    if ((cache.ENTRY === false) && cache.BLE)
                        userPrompt[currentStep].push(`Bullish Engulfing Pattern`);
                },
                MDS: () => {
                    if (cache.MDS === null) {
                        cache.MDS = (0, technicalindicators_1.morningdojistar)(csd);
                    }
                    if ((cache.ENTRY === false) && cache.MDS)
                        userPrompt[currentStep].push(`Morning Doji Star`);
                },
                DFD: () => {
                    if (cache.DFD === null) {
                        cache.DFD = (0, technicalindicators_1.dragonflydoji)(csd);
                    }
                    if ((cache.ENTRY === false) && cache.DFD)
                        userPrompt[currentStep].push(`Dragon Fly Doji`);
                },
                BLH: () => {
                    if (cache.BLH === null) {
                        cache.BLH = (0, technicalindicators_1.bullishharami)(csd);
                    }
                    if ((cache.ENTRY === false) && cache.BLH)
                        userPrompt[currentStep].push(`Bullish Harami`);
                },
                BLM: () => {
                    if (cache.BLM === null) {
                        cache.BLM = (0, technicalindicators_1.bullishmarubozu)(csd);
                    }
                    if ((cache.ENTRY === false) && cache.BLM)
                        userPrompt[currentStep].push(`Bullish Marubozu`);
                },
                BLC: () => {
                    if (cache.BLC === null) {
                        cache.BLC = (0, technicalindicators_1.bullishharamicross)(csd);
                    }
                    if ((cache.ENTRY === false) && cache.BLC)
                        userPrompt[currentStep].push(`Bullish Harami Cross`);
                },
                BEP: () => {
                    if (cache.BEP === null) {
                        cache.BEP = (0, technicalindicators_1.bearishengulfingpattern)(csd);
                    }
                    if ((cache.ENTRY === true) && cache.BEP)
                        userPrompt[currentStep].push(`Bearish Engulfing Pattern`);
                },
                EDS: () => {
                    if (cache.EDS === null) {
                        cache.EDS = (0, technicalindicators_1.eveningdojistar)(csd);
                    }
                    if ((cache.ENTRY === true) && cache.EDS)
                        userPrompt[currentStep].push(`Evening Doji Star`);
                },
                GSD: () => {
                    if (cache.GSD === null) {
                        cache.GSD = (0, technicalindicators_1.gravestonedoji)(csd);
                    }
                    if ((cache.ENTRY === true) && cache.GSD)
                        userPrompt[currentStep].push(`Gravestone Doji`);
                },
                BRH: () => {
                    if (cache.BRH === null) {
                        cache.BRH = (0, technicalindicators_1.bearishharami)(csd);
                    }
                    if ((cache.ENTRY === true) && cache.BRH)
                        userPrompt[currentStep].push(`Bearish Harami`);
                },
                BRM: () => {
                    if (cache.BRM === null) {
                        cache.BRM = (0, technicalindicators_1.bearishmarubozu)(csd);
                    }
                },
                BHC: () => {
                    if (cache.BHC === null) {
                        cache.BHC = (0, technicalindicators_1.bearishharamicross)(csd);
                    }
                    if ((cache.ENTRY === true) && cache.BHC)
                        userPrompt[currentStep].push(`Bearish Harami Cross`);
                },
                ATR: () => {
                    var _a;
                    if (cache.ATR === null) {
                        const atr = technicalindicators_1.ATR.calculate({ period: (_a = site_1.Site.IN_CFG.ATR_P) !== null && _a !== void 0 ? _a : 14, close, high, low });
                        const perc = ((atr[atr.length - 1] || 0) / latestRate) * 100;
                        cache.ATR = perc;
                    }
                    userPrompt[currentStep].push(`ATR = ${(cache.ATR || 0).toFixed(2)}% of price ${AnalysisEngine.getParamsForInd('ATR_').replace("P", "period") || "default"}`);
                },
            };
            /**
             * Computes entry point.
             */
            const step1 = () => {
                currentStep = 1;
                ensureInd[site_1.Site.STR_ENTRY_IND]();
                if (!AnalysisEngine.isEntryBull[symbol]) {
                    AnalysisEngine.isEntryBull[symbol] = [];
                }
                if (!AnalysisEngine.isEntryBear[symbol]) {
                    AnalysisEngine.isEntryBear[symbol] = [];
                }
                AnalysisEngine.isEntryBull[symbol].push(cache[`${site_1.Site.STR_ENTRY_IND}_BULL`] || false);
                AnalysisEngine.isEntryBear[symbol].push(cache[`${site_1.Site.STR_ENTRY_IND}_BEAR`] || false);
                if (AnalysisEngine.isEntryBull[symbol].length > (site_1.Site.IN_CFG.DIR_LEN || 5)) {
                    AnalysisEngine.isEntryBull[symbol] = AnalysisEngine.isEntryBull[symbol].slice(AnalysisEngine.isEntryBull[symbol].length - (site_1.Site.IN_CFG.DIR_LEN || 5));
                }
                if (AnalysisEngine.isEntryBear[symbol].length > (site_1.Site.IN_CFG.DIR_LEN || 5)) {
                    AnalysisEngine.isEntryBear[symbol] = AnalysisEngine.isEntryBear[symbol].slice(AnalysisEngine.isEntryBear[symbol].length - (site_1.Site.IN_CFG.DIR_LEN || 5));
                }
                if (AnalysisEngine.isEntryBull[symbol].length >= 2 ? (((AnalysisEngine.isEntryBull[symbol][AnalysisEngine.isEntryBull[symbol].length - 1]) && (!AnalysisEngine.isEntryBull[symbol][AnalysisEngine.isEntryBull[symbol].length - 2]))) : false) {
                    return true;
                }
                if (AnalysisEngine.isEntryBear[symbol].length >= 2 ? (((AnalysisEngine.isEntryBear[symbol][AnalysisEngine.isEntryBear[symbol].length - 1]) && (!AnalysisEngine.isEntryBear[symbol][AnalysisEngine.isEntryBear[symbol].length - 2]))) : false) {
                    return false;
                }
                return null;
            };
            /**
             * Confirms trend.
             */
            const step2 = () => {
                currentStep = 2;
                for (let i = 0; i < site_1.Site.STR_TREND_IND.length; i++) {
                    ensureInd[site_1.Site.STR_TREND_IND[i]]();
                }
                currentStep = 0;
                const bools = site_1.Site.STR_TREND_IND.map(x => cache[`${x}_${cache.ENTRY ? 'BULL' : 'BEAR'}`] || false);
                return (0, boolean_consolidator_1.booleanConsolidator)(bools, site_1.Site.STR_TREND_CV);
            };
            /**
             * Confirms strong trend.
             */
            const step3 = () => {
                currentStep = 3;
                ensureInd.ADX();
                currentStep = 0;
                return cache.STRONG || false;
            };
            /**
             * Detects overbought.
             */
            const step4 = () => {
                currentStep = 4;
                for (let i = 0; i < site_1.Site.STR_OB_IND.length; i++) {
                    ensureInd[site_1.Site.STR_OB_IND[i]]();
                }
                currentStep = 0;
                const bools = site_1.Site.STR_OB_IND.map(x => cache[`${x}_${cache.ENTRY ? 'OB' : 'OS'}`] || false);
                return (0, boolean_consolidator_1.booleanConsolidator)(bools, site_1.Site.STR_OB_CV);
            };
            /**
             * Detects reversal patterns.
             */
            const step5 = () => {
                currentStep = 5;
                for (let i = 0; i < (cache.ENTRY ? site_1.Site.STR_REV_IND_BULL : site_1.Site.STR_REV_IND_BEAR).length; i++) {
                    ensureInd[(cache.ENTRY ? site_1.Site.STR_REV_IND_BULL : site_1.Site.STR_REV_IND_BEAR)[i]]();
                }
                currentStep = 0;
                const bools = (cache.ENTRY ? site_1.Site.STR_REV_IND_BULL : site_1.Site.STR_REV_IND_BEAR).map(x => cache[`${x}`] || false);
                return (0, boolean_consolidator_1.booleanConsolidator)(bools, site_1.Site.STR_REV_CV);
            };
            /**
             * Computes stoploss price.
             */
            const step6 = () => {
                currentStep = 6;
                ensureInd[site_1.Site.STR_TSL_IND]();
                currentStep = 0;
                if (cache.ENTRY === true) {
                    return cache[`${site_1.Site.STR_TSL_IND}_SL`] < latestRate ? cache[`${site_1.Site.STR_TSL_IND}_SL`] : (latestRate - (cache[`${site_1.Site.STR_TSL_IND}_SL`] - latestRate));
                }
                else if (cache.ENTRY === false) {
                    return cache[`${site_1.Site.STR_TSL_IND}_SL`] > latestRate ? cache[`${site_1.Site.STR_TSL_IND}_SL`] : (latestRate + (latestRate - cache[`${site_1.Site.STR_TSL_IND}_SL`]));
                }
                return 0;
            };
            /**
             * Ensures price volatility is within suitable percentage range.
             */
            const step7 = () => {
                currentStep = 7;
                ensureInd.ATR();
                currentStep = 0;
                return cache.ATR >= (site_1.Site.STR_VOL_RNG[0] || 0) && cache.ATR <= (site_1.Site.STR_VOL_RNG[1] || Infinity);
            };
            let stoploss = 0;
            let long = false;
            let short = false;
            let desc = "No Signal";
            log_1.Log.flow([AnalysisEngine.slug, symbol, `Checking for entry...`], 6);
            cache.ENTRY = step1();
            const flip = (cache.ENTRY === true) ? "Bullish flip" : (cache.ENTRY === false) ? "Bearish flip" : "";
            const sig = (cache.ENTRY === true) ? "Long" : (cache.ENTRY === false) ? "Short" : "";
            userPrompt[currentStep][0] = `${site_1.Site.STR_ENTRY_IND.replace("ICH", "ICH").replace("PSR", "PSAR").replace("MCD", "MACD")} = ${flip} → ${sig} ${userPrompt[currentStep][0]}`;
            currentStep = 0;
            if (cache.ENTRY === true || cache.ENTRY === false) {
                // Entry detected.
                log_1.Log.flow([AnalysisEngine.slug, symbol, `Entry detected. Confirming ${cache.ENTRY ? 'bull' : 'bear'} trend...`], 6);
                if ((step2() && site_1.Site.STR_TREND_FV) || (!site_1.Site.STR_TREND_FV)) {
                    // Trend confirmed.
                    log_1.Log.flow([AnalysisEngine.slug, symbol, `Trend confirmed. Checking trend strength...`], 6);
                    if ((step3() && site_1.Site.STR_STG_FV) || (!site_1.Site.STR_STG_FV)) {
                        // Trend strength confirmed.
                        log_1.Log.flow([AnalysisEngine.slug, symbol, `Strength is acceptable. Checking if over${cache.ENTRY ? 'bought' : 'sold'}...`], 6);
                        log_1.Log.flow([AnalysisEngine.slug, symbol, ``], 6);
                        if (((!step4()) && site_1.Site.STR_OB_FV) || (!site_1.Site.STR_OB_FV)) {
                            // No presence of effecting overbought confirmed.
                            log_1.Log.flow([AnalysisEngine.slug, symbol, `Overbought condition acceptable. Checking for reversals...`], 6);
                            if (((!step5()) && site_1.Site.STR_REV_FV) || (!site_1.Site.STR_REV_FV)) {
                                log_1.Log.flow([AnalysisEngine.slug, symbol, `Reversal conditions acceptable. Checking volatility...`], 6);
                                // No reversl detected.
                                if (step7()) {
                                    // Volatility is acceptable
                                    log_1.Log.flow([AnalysisEngine.slug, symbol, `Volatility is acceptable. Buy signal confirmed.`], 6);
                                    if (cache.ENTRY) {
                                        long = true;
                                        desc = "Confirmed Long";
                                    }
                                    else {
                                        short = true;
                                        desc = "Confirmed Short";
                                    }
                                }
                                else {
                                    log_1.Log.flow([AnalysisEngine.slug, symbol, `Volatility out of range.`], 6);
                                }
                            }
                            else {
                                log_1.Log.flow([AnalysisEngine.slug, symbol, `Trend reversal detected.`], 6);
                            }
                        }
                        else {
                            log_1.Log.flow([AnalysisEngine.slug, symbol, `Ticker is overbought`], 6);
                        }
                    }
                    else {
                        log_1.Log.flow([AnalysisEngine.slug, symbol, `Strength not acceptable.`], 6);
                    }
                }
                else {
                    log_1.Log.flow([AnalysisEngine.slug, symbol, `Trend not confirmed.`], 6);
                }
            }
            else {
                log_1.Log.flow([AnalysisEngine.slug, symbol, `No entry detected.`], 6);
            }
            stoploss = step6();
            const signal = new signal_1.Signal(short, long, desc, cache.ATR, stoploss, latestRate, userPrompt);
            cache = Object.fromEntries(Object.entries(cache).filter(([__dirname, v]) => v !== null));
            // CONCLUDE ANALYSIS
            log_1.Log.flow([AnalysisEngine.slug, symbol, "Success", `Long: ${signal.long ? "Yes" : "No"} | Short: ${signal.short ? "Yes" : "No"} | Price: ${(0, format_number_1.FFF)(latestRate)}${stoploss ? ` | Stoploss: ${(0, format_number_1.FFF)(stoploss)}` : ""}.`], 5);
            if (signal.long || signal.short) {
                resolve(signal);
            }
            else {
                resolve(null);
            }
        }
        else {
            log_1.Log.flow([AnalysisEngine.slug, symbol, "Error", `Not enough rows.`], 5);
            resolve(null);
        }
    });
};
