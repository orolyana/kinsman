import { config } from "dotenv";
import { RegexPatterns } from "./lib/regex";
import path from "path";
const args = process.argv.slice(2);
config({
    path: args[0] || ".env",
})

export class Site {
    static TITLE: string = process.env["TITLE"] || "Kinsmen";
    static ROOT: string = process.cwd() || __dirname;
    static PORT: number = parseInt(process.env["PORT"] || "0") || 3000;
    static PRODUCTION = (process.env["PRODUCTION"] || "").toLowerCase() == "true";
    static FORCE_FAMILY_4 = (process.env["FORCE_FAMILY_4"] || "").toLowerCase() == "true";
    static EXIT_ON_UNCAUGHT_EXCEPTION = (process.env["EXIT_ON_UNCAUGHT_EXCEPTION"] || "").toLowerCase() == "true";
    static EXIT_ON_UNHANDLED_REJECTION = (process.env["EXIT_ON_UNHANDLED_REJECTION"] || "").toLowerCase() == "true";
    static START_LOCATION_ENGINE = (process.env["START_LOCATION_ENGINE"] || "").toLowerCase() == "true";
    static URL = Site.PRODUCTION ? (process.env["PROD_URL"] || "") : `http://localhost:${Site.PORT}`;
    static MAX_ALLOWED_FLOG_LOG_WEIGHT: number = parseInt(process.env["MAX_ALLOWED_FLOG_LOG_WEIGHT"] || "0") || 5;

    static PE_INTERVAL_MS: number = parseInt(process.env["PE_INTERVAL_MS"] || "0") || 60000;
    static PE_MAX_RECORDS: number = parseInt(process.env["PE_MAX_RECORDS"] || "0") || 100;
    static PE_DATA_TIMEOUT_MS: number = parseInt(process.env["PE_DATA_TIMEOUT_MS"] || "0") || 120000;
    static PE_SOURCE_URL: string = process.env["PE_SOURCE_URL"] || "https://query1.finance.yahoo.com/v8/finance/chart";
    static PE_INITIAL_PAIRS: string[] = (process.env["PE_INITIAL_PAIRS"] || "").split(" ").filter(x => RegexPatterns.pair.test(x));
    static PE_TP_SL_MULTIPLIER: number = parseInt(process.env["PE_TP_SL_MULTIPLIER"] || "0") || 1;

    static TG_TOKEN: string = process.env["TG_TOKEN"] ?? "";
    static TG_CHAT_ID: number = parseInt(process.env["TG_CHAT_ID"] ?? "0") || 0;
    static TG_POLLING: boolean = (process.env["TG_POLLING"] || "").toLowerCase() == "true";
    static TG_WH_SECRET_TOKEN: string = process.env["TG_WH_SECRET_TOKEN"] ?? "edqfwvrebwtn7f";
    static TG_BOT_URL: string = process.env["TG_BOT_URL"] ?? "";

    static IN_CFG: Record<string, any> = Object.fromEntries(
        ((process.env.IN_CFG || "")
            .replace(/[\n\r]/g, " ")
            .split(" ")
            .filter(x => x.length > 0)
            .reduce<[string, string | number | boolean][]>((acc, val, i, arr) => {
                if (i % 2 === 0) return acc;
                const key = arr[i - 1];
                let parsed: string | number | boolean;

                if (/^true$/i.test(val)) parsed = true;
                else if (/^false$/i.test(val)) parsed = false;
                else if (!isNaN(Number(val))) parsed = val.includes(".") ? parseFloat(val) : parseInt(val);
                else parsed = val;

                return acc.concat([[key, parsed]]);
            }, []))
    );
    // static IN_ML_DATA_PATH: string = (path.join(Site.ROOT, `analysis/ml_${Site.IN_CFG.ML_DATA_PATH || "default"}.json`));

    static STR_ENTRY_IND: string = process.env.STR_ENTRY_IND || "ICH";
    static STR_TREND_IND: string[] = (process.env.STR_TREND_IND || "BLL").split(" ").filter(x => x.length == 3);
    static STR_TREND_CV: number = parseFloat(process.env.STR_TREND_CV || "0") || 0;
    static STR_TREND_FV: number = parseFloat(process.env.STR_TREND_FV || "0") || 0;
    static STR_STG_FV: number = parseFloat(process.env.STR_STG_FV || "0") || 0;
    static STR_OB_IND: string[] = (process.env.STR_OB_IND || "STC").split(" ").filter(x => x.length == 3);
    static STR_OB_CV: number = parseFloat(process.env.STR_OB_CV || "0") || 0;
    static STR_OB_FV: number = parseFloat(process.env.STR_OB_FV || "0") || 0;
    static STR_REV_IND_BULL: string[] = (process.env.STR_REV_IND_BULL || "STR HGM EST TBC PIL DCC TTP").split(" ").filter(x => x.length == 3);
    static STR_REV_IND_BEAR: string[] = (process.env.STR_REV_IND_BEAR || "TWS MST HMR TBT").split(" ").filter(x => x.length == 3);
    static STR_REV_CV: number = parseFloat(process.env.STR_REV_CV || "0") || 0;
    static STR_REV_FV: number = parseFloat(process.env.STR_REV_FV || "0") || 0;
    static STR_TSL_IND: string = process.env.STR_TSL_IND || "PSR";
    static STR_VOL_RNG: number[] = (process.env.STR_VOL_RNG || "0 0").split(" ").filter(x => x.length > 0).map(x => parseFloat(x)).filter(x => (!Number.isNaN(x)));

    static DC_MAX_LATEST_SIGNALS: number = parseInt(process.env.DC_MAX_LATEST_SIGNALS || "0") || 5;
    static DC_MIN_DOM_PERC: number = parseFloat(process.env.DC_MIN_DOM_PERC || '0') || 51;

    static GROQ_KEY: string = process.env["GROQ_KEY"] || "";
    static GROQ_ENDPOINT: string = process.env["GROQ_ENDPOINT"] || "";
    static GROQ_MODELS: string[] = (process.env["GROQ_MODELS"] || "").split(" ").filter(x => x.length > 0);
    static GROQ_REQUEST_TIMEOUT_MS: number = parseInt(process.env["GROQ_REQUEST_TIMEOUT_MS"] || "0") || Infinity;
    static GROQ_MAX_RETRIES: number = parseInt(process.env["GROQ_MAX_RETRIES"] || "0") || 1;
    static GROQ_HTTP_TIMEOUT_MS: number = parseInt(process.env["GROQ_HTTP_TIMEOUT_MS"] || "0") || 60000;
    static GROQ_USE: boolean = (process.env["GROQ_USE"] || "").toLowerCase() == "true";
    static GROQ_MAX_HISTORY_COUNT: number = parseInt(process.env["GROQ_MAX_HISTORY_COUNT"] || "0") || 5;

    static WS_URL: string = process.env.WS_URL || "wss://streamer.finance.yahoo.com";
    static WS_RECON_DELYAY_MS: number = parseInt(process.env.WS_RECON_DELYAY_MS || "0") || 5000;
}