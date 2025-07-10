export class Occurrence {
    private signal!: 'long' | 'short';
    private count!: number;
    private timeSinceOccured!: number;

    update(isLong: boolean){
        const newSignal: 'long' | 'short' = isLong ? "long" : "short";
        if (newSignal == this.signal) {
            this.count++;
        }
        else {
            this.signal = newSignal;
            this.count = 1;
            this.timeSinceOccured = Date.now();
        }
    }

    getCount() {
        return this.count;
    }

    getTimeSinceFirst(){
        return this.timeSinceOccured;
    }

    constructor(isLong: boolean) {
        this.signal = isLong ? "long" : "short";
        this.count = 1;
        this.timeSinceOccured = Date.now();
    }
}