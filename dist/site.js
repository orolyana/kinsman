"use strict";
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Site = void 0;
const dotenv_1 = require("dotenv");
const regex_1 = require("./lib/regex");
const args = process.argv.slice(2);
(0, dotenv_1.config)({
    path: args[0] || ".env",
});
class Site {
}
exports.Site = Site;
Site.TITLE = process.env["TITLE"] || "Kinsmen";
Site.ROOT = process.cwd() || __dirname;
Site.PORT = parseInt(process.env["PORT"] || "0") || 3000;
Site.PRODUCTION = (process.env["PRODUCTION"] || "").toLowerCase() == "true";
Site.FORCE_FAMILY_4 = (process.env["FORCE_FAMILY_4"] || "").toLowerCase() == "true";
Site.EXIT_ON_UNCAUGHT_EXCEPTION = (process.env["EXIT_ON_UNCAUGHT_EXCEPTION"] || "").toLowerCase() == "true";
Site.EXIT_ON_UNHANDLED_REJECTION = (process.env["EXIT_ON_UNHANDLED_REJECTION"] || "").toLowerCase() == "true";
Site.START_LOCATION_ENGINE = (process.env["START_LOCATION_ENGINE"] || "").toLowerCase() == "true";
Site.URL = Site.PRODUCTION ? (process.env["PROD_URL"] || "") : `http://localhost:${Site.PORT}`;
Site.MAX_ALLOWED_FLOG_LOG_WEIGHT = parseInt(process.env["MAX_ALLOWED_FLOG_LOG_WEIGHT"] || "0") || 5;
Site.PE_INTERVAL_MS = parseInt(process.env["PE_INTERVAL_MS"] || "0") || 60000;
Site.PE_MAX_RECORDS = parseInt(process.env["PE_MAX_RECORDS"] || "0") || 100;
Site.PE_DATA_TIMEOUT_MS = parseInt(process.env["PE_DATA_TIMEOUT_MS"] || "0") || 120000;
Site.PE_SOURCE_URL = process.env["PE_SOURCE_URL"] || "https://query1.finance.yahoo.com/v8/finance/chart";
Site.PE_INITIAL_PAIRS = (process.env["PE_INITIAL_PAIRS"] || "").split(" ").filter(x => regex_1.RegexPatterns.pair.test(x));
Site.TG_TOKEN = (_a = process.env["TG_TOKEN"]) !== null && _a !== void 0 ? _a : "";
Site.TG_CHAT_ID = parseInt((_b = process.env["TG_CHAT_ID"]) !== null && _b !== void 0 ? _b : "0") || 0;
Site.TG_POLLING = (process.env["TG_POLLING"] || "").toLowerCase() == "true";
Site.TG_WH_SECRET_TOKEN = (_c = process.env["TG_WH_SECRET_TOKEN"]) !== null && _c !== void 0 ? _c : "edqfwvrebwtn7f";
Site.TG_BOT_URL = (_d = process.env["TG_BOT_URL"]) !== null && _d !== void 0 ? _d : "";
Site.IN_CFG = Object.fromEntries(((process.env.IN_CFG || "")
    .replace(/[\n\r]/g, " ")
    .split(" ")
    .filter(x => x.length > 0)
    .reduce((acc, val, i, arr) => {
    if (i % 2 === 0)
        return acc;
    const key = arr[i - 1];
    let parsed;
    if (/^true$/i.test(val))
        parsed = true;
    else if (/^false$/i.test(val))
        parsed = false;
    else if (!isNaN(Number(val)))
        parsed = val.includes(".") ? parseFloat(val) : parseInt(val);
    else
        parsed = val;
    return acc.concat([[key, parsed]]);
}, [])));
// static IN_ML_DATA_PATH: string = (path.join(Site.ROOT, `analysis/ml_${Site.IN_CFG.ML_DATA_PATH || "default"}.json`));
Site.STR_ENTRY_IND = process.env.STR_ENTRY_IND || "ICH";
Site.STR_TREND_IND = (process.env.STR_TREND_IND || "BLL").split(" ").filter(x => x.length == 3);
Site.STR_TREND_CV = parseFloat(process.env.STR_TREND_CV || "0") || 0;
Site.STR_TREND_FV = parseFloat(process.env.STR_TREND_FV || "0") || 0;
Site.STR_STG_FV = parseFloat(process.env.STR_STG_FV || "0") || 0;
Site.STR_OB_IND = (process.env.STR_OB_IND || "STC").split(" ").filter(x => x.length == 3);
Site.STR_OB_CV = parseFloat(process.env.STR_OB_CV || "0") || 0;
Site.STR_OB_FV = parseFloat(process.env.STR_OB_FV || "0") || 0;
Site.STR_REV_IND_BULL = (process.env.STR_REV_IND_BULL || "STR HGM EST TBC PIL DCC TTP").split(" ").filter(x => x.length == 3);
Site.STR_REV_IND_BEAR = (process.env.STR_REV_IND_BEAR || "TWS MST HMR TBT").split(" ").filter(x => x.length == 3);
Site.STR_REV_CV = parseFloat(process.env.STR_REV_CV || "0") || 0;
Site.STR_REV_FV = parseFloat(process.env.STR_REV_FV || "0") || 0;
Site.STR_TSL_IND = process.env.STR_TSL_IND || "PSR";
Site.STR_VOL_RNG = (process.env.STR_VOL_RNG || "0 0").split(" ").filter(x => x.length > 0).map(x => parseFloat(x)).filter(x => (!Number.isNaN(x)));
Site.DC_MAX_LATEST_SIGNALS = parseInt(process.env.DC_MAX_LATEST_SIGNALS || "0") || 5;
Site.DC_MIN_DOM_PERC = parseFloat(process.env.DC_MIN_DOM_PERC || '0') || 51;
Site.GROQ_KEY = process.env["GROQ_KEY"] || "";
Site.GROQ_ENDPOINT = process.env["GROQ_ENDPOINT"] || "";
Site.GROQ_MODELS = (process.env["GROQ_MODELS"] || "").split(" ").filter(x => x.length > 0);
Site.GROQ_REQUEST_TIMEOUT_MS = parseInt(process.env["GROQ_REQUEST_TIMEOUT_MS"] || "0") || Infinity;
Site.GROQ_MAX_RETRIES = parseInt(process.env["GROQ_MAX_RETRIES"] || "0") || 1;
Site.GROQ_HTTP_TIMEOUT_MS = parseInt(process.env["GROQ_HTTP_TIMEOUT_MS"] || "0") || 60000;
Site.GROQ_USE = (process.env["GROQ_USE"] || "").toLowerCase() == "true";
Site.GROQ_MAX_HISTORY_COUNT = parseInt(process.env["GROQ_MAX_HISTORY_COUNT"] || "0") || 5;
Site.WS_URL = process.env.WS_URL || "wss://streamer.finance.yahoo.com";
Site.WS_RECON_DELYAY_MS = parseInt(process.env.WS_RECON_DELYAY_MS || "0") || 5000;
