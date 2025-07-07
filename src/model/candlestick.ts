export class Candlestick {
    open!: number;
    high!: number;
    low!: number;
    close!: number;
    volume!: number;
    ts!: number;

    constructor(open: number, high: number, low: number, close: number, volume: number, ts: number = Date.now()){
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.volume = volume;
        this.ts = ts;
    }
}