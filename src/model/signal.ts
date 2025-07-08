export class Signal {
    short!: boolean;
    long!: boolean;
    description!: string;
    volatilityPerc!: number;
    tpsl!: number;
    markPrice!: number;
    cachedPrompt!: string[][];

    constructor(
        short: boolean,
        long: boolean,
        description: string,
        volatilityPerc: number,
        tpsl: number,
        markPrice: number,
        cachedPrompt: string[][],
    ) {
        this.short = short;
        this.long = long;
        this.description = description;
        this.volatilityPerc = volatilityPerc;
        this.tpsl = tpsl;
        this.markPrice = markPrice;
        this.cachedPrompt = cachedPrompt;
    }
}