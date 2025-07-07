import { Candlestick } from "./candlestick";

interface TradingPeriod {
    timezone: string;
    end: number;
    start: number;
    gmtoffset: number;
}

interface CurrentTradingPeriod {
    pre: TradingPeriod;
    regular: TradingPeriod;
    post: TradingPeriod;
}

interface Meta {
    currency: string;
    symbol: string;
    exchangeName: string;
    fullExchangeName: string;
    instrumentType: string;
    firstTradeDate: number;
    regularMarketTime: number;
    hasPrePostMarketData: boolean;
    gmtoffset: number;
    timezone: string;
    exchangeTimezoneName: string;
    regularMarketPrice: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    regularMarketDayHigh: number;
    regularMarketDayLow: number;
    regularMarketVolume: number;
    longName: string;
    shortName: number;
    chartPreviousClose: number;
    previousClose: number;
    scale: number;
    priceHint: number;
    currentTradingPeriod: CurrentTradingPeriod;
    tradingPeriods: TradingPeriod[];
    dataGranularity: string;
    range: string;
    validRanges: string[]; // "1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"

}

interface Quote {
    open: (number | null)[]
    high: (number | null)[]
    low: (number | null)[]
    close: (number | null)[]
    volume: (number | null)[]
}

export interface APIResponse {
    meta: Meta;
    timestamp: number[];
    indicators: {
        quote: Quote[];
    }
};

export interface FetchResponse {
    fullExchangeName: string;
    regularMarketPrice: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    regularMarketDayHigh: number;
    regularMarketDayLow: number;
    regularMarketVolume: number;
    candlestick: Candlestick[];
}