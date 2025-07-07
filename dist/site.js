"use strict";
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Site = void 0;
const dotenv_1 = require("dotenv");
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
Site.TG_TOKEN = (_a = process.env["TG_TOKEN"]) !== null && _a !== void 0 ? _a : "";
Site.TG_CHAT_ID = parseInt((_b = process.env["TG_CHAT_ID"]) !== null && _b !== void 0 ? _b : "0") || 0;
Site.TG_POLLING = (process.env["TG_POLLING"] || "").toLowerCase() == "true";
Site.TG_WH_SECRET_TOKEN = (_c = process.env["TG_WH_SECRET_TOKEN"]) !== null && _c !== void 0 ? _c : "edqfwvrebwtn7f";
Site.TG_BOT_URL = (_d = process.env["TG_BOT_URL"]) !== null && _d !== void 0 ? _d : "";
