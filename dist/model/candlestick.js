"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Candlestick = void 0;
class Candlestick {
    constructor(open, high, low, close, volume, ts = Date.now()) {
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.volume = volume;
        this.ts = ts;
    }
}
exports.Candlestick = Candlestick;
