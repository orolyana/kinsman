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
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopEngine = exports.startEngine = void 0;
const date_time_1 = require("../lib/date_time");
const site_1 = require("../site");
const analysis_1 = require("./analysis");
const pair_1 = require("./pair");
const telegram_1 = require("./telegram");
const startEngine = () => new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
    const loaded = (yield telegram_1.TelegramEngine.start()) && (yield pair_1.PairEngine.start());
    resolve(loaded);
}));
exports.startEngine = startEngine;
const stopEngine = () => new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
    const conclude = () => __awaiter(void 0, void 0, void 0, function* () {
        const ended = yield Promise.all([
            pair_1.PairEngine.stop(),
            analysis_1.AnalysisEngine.stop(),
        ]);
        resolve(ended.every(v => v === true));
    });
    if (site_1.Site.PRODUCTION) {
        telegram_1.TelegramEngine.sendMessage(`😴 ${site_1.Site.TITLE} is going back to sleep at ${(0, date_time_1.getDateTime)()}`, (mid) => __awaiter(void 0, void 0, void 0, function* () {
            conclude();
        }));
    }
    else {
        conclude();
    }
}));
exports.stopEngine = stopEngine;
