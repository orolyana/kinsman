export interface Currency {
    relations: Record<string, boolean | null>;
    history: number[];
}

export type Relationship = Record<string, Currency>;

export interface Snapshot {
    strength: number;
    trend: number;
    momentum: number;
    volatility: number;
    history: number[];
}
