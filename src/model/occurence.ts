export class Occurrence {
    signal!: 'long' | 'short';
    count!: number;

    update(isLong: boolean){
        const newSignal: 'long' | 'short' = isLong ? "long" : "short";
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

    constructor(isLong: boolean) {
        this.signal = isLong ? "long" : "short";
        this.count = 1;
    }
}