"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PairEngine = void 0;
const log_1 = require("../lib/log");
class PairEngine {
}
exports.PairEngine = PairEngine;
PairEngine.slug = "Pair Engine";
PairEngine.start = () => new Promise((resolve, reject) => {
    log_1.Log.flow([PairEngine.slug, 'Initialized.'], 0);
    resolve(true);
});
PairEngine.stop = () => new Promise((resolve, reject) => {
    resolve(true);
});
