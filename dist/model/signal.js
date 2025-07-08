"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signal = void 0;
class Signal {
    constructor(short, long, description, volatilityPerc, tpsl, markPrice, cachedPrompt) {
        this.short = short;
        this.long = long;
        this.description = description;
        this.volatilityPerc = volatilityPerc;
        this.tpsl = tpsl;
        this.markPrice = markPrice;
        this.cachedPrompt = cachedPrompt;
    }
}
exports.Signal = Signal;
