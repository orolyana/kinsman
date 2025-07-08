"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Occurrence = void 0;
class Occurrence {
    update(isLong) {
        const newSignal = isLong ? "long" : "short";
        if (newSignal == this.signal) {
            this.count++;
        }
        else {
            this.signal = newSignal;
            this.count = 1;
        }
    }
    getCount() {
        return this.count;
    }
    constructor(isLong) {
        this.signal = isLong ? "long" : "short";
        this.count = 1;
    }
}
exports.Occurrence = Occurrence;
