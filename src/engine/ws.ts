import { WebSocket } from "ws";
import { Log } from "../lib/log";
import * as protobuf from 'protobufjs';
import { Site } from "../site";


const proto = `
syntax = "proto3";

message PricingData {

enum QuoteType {
    NONE = 0;
    ALTSYMBOL = 5;
    HEARTBEAT = 7;
    EQUITY = 8;
    INDEX = 9;
    MUTUALFUND = 11;
    MONEYMARKET = 12;
    OPTION = 13;
    CURRENCY = 14;
    WARRANT = 15;
    BOND = 17;
    FUTURE = 18;
    ETF = 20;
    COMMODITY = 23;
    ECNQUOTE = 28;
    CRYPTOCURRENCY = 41;
    INDICATOR = 42;
    INDUSTRY = 1000;
};

enum OptionType {
    CALL = 0;
    PUT = 1;
};

enum MarketHoursType {
    PRE_MARKET = 0;
    REGULAR_MARKET = 1;
    POST_MARKET = 2;
    EXTENDED_HOURS_MARKET = 3;
};

    string id = 1;
    float price = 2;
    sint64 time = 3;
    string currency = 4;
    string exchange = 5;


    QuoteType quoteType = 6;
    MarketHoursType marketHours = 7;
    float changePercent = 8;
    sint64 dayVolume = 9;
    float dayHigh = 10;
    float dayLow = 11;
    float change = 12;
    string shortName = 13;
    sint64 expireDate = 14;
    float openPrice = 15;
    float previousClose = 16;
    float strikePrice = 17;
    string underlyingSymbol = 18;
    sint64 openInterest = 19;
    OptionType optionsType = 20;
    sint64 miniOption = 21;
    sint64 lastSize = 22;
    float bid = 23;
    sint64 bidSize = 24;
    float ask = 25;
    sint64 askSize = 26;
    sint64 priceHint = 27;
    sint64 vol_24hr = 28;
    sint64 volAllCurrencies = 29;
    string fromcurrency = 30;
    string lastMarket = 31;
    double circulatingSupply = 32;
    double marketcap = 33;
};


message StaticData {
    string id = 1;
    string displayName = 5;
};
`;

const root = protobuf.parse(proto).root;
const PricingData = root.lookupType("PricingData");

let cachedPairEngine: typeof import('./pair').PairEngine | null = null;
const PairEngine = async () => {
    if (!cachedPairEngine) {
        cachedPairEngine = ((await import('./pair'))).PairEngine;
    }
    return cachedPairEngine;
}

const WS_URL = Site.WS_URL;
const WS_RECON_DELYAY_MS = Site.WS_RECON_DELYAY_MS;

export class WSEngine {

    private static slug = "WS";

    private static ws: WebSocket | null = null;

    private static subs: string[] = [];

    static subscribe = (symbol: string) => {
        let payload = {
            subscribe: [symbol],
        };

        if (WSEngine.ws && WSEngine.ws.OPEN === WSEngine.ws.readyState) {
            WSEngine.ws.send(JSON.stringify(payload));
        }
        WSEngine.subs.push(symbol);
    }

    static unsubscribe = (symbol: string) => {
        let payload = {
            unsubscribe: [symbol],
        };

        if (WSEngine.ws && WSEngine.ws.OPEN  === WSEngine.ws.readyState) {
            WSEngine.ws.send(JSON.stringify(payload));
        }
        WSEngine.subs = WSEngine.subs.filter(x => x != symbol);
    }

    private static connect = () => {
        WSEngine.ws = new WebSocket(WS_URL);
        WSEngine.ws.on('open', () => {
            Log.flow([WSEngine.slug, `Connected.`], 4);

            if (WSEngine.subs.length > 0 && WSEngine.ws) {
                let payload = {
                    subscribe: WSEngine.subs
                };

                WSEngine.ws.send(JSON.stringify(payload));
            }
        });

        WSEngine.ws.on('close', () => {
            Log.flow([WSEngine.slug, `Disconnected.`], 4);
            setTimeout(() => {
                WSEngine.connect();
            }, WS_RECON_DELYAY_MS);
        });

        WSEngine.ws.on('error', (err) => {
            Log.flow([WSEngine.slug, `Error`, err.message], 4);
        });

        WSEngine.ws.on('message', async data => {
            try {
                const buffer = Buffer.from(data.toString(), "base64");
                const d: any = PricingData.decode(buffer);
                if(d.id && d.price){
                    (await PairEngine()).updateMarkPrice(d.id, d.price);
                }
            } catch (error) {
                Log.dev(error);
            }
        });
    }

    static start = () => new Promise<boolean>((resolve, reject) => {
        WSEngine.connect();
        resolve(true);
    });

    static stop = () => new Promise<boolean>((resolve, reject) => {
        resolve(true);
    });
}
