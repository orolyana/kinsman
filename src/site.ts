import { config } from "dotenv";
const args = process.argv.slice(2);
config({
    path: args[0] || ".env",
})

export class Site {
    static TITLE: string  = process.env["TITLE"] || "Kinsmen";
    static ROOT: string = process.cwd() || __dirname;
    static PORT: number = parseInt(process.env["PORT"] || "0") || 3000;
    static PRODUCTION = (process.env["PRODUCTION"] || "").toLowerCase() == "true";
    static FORCE_FAMILY_4 = (process.env["FORCE_FAMILY_4"] || "").toLowerCase() == "true";
    static EXIT_ON_UNCAUGHT_EXCEPTION = (process.env["EXIT_ON_UNCAUGHT_EXCEPTION"] || "").toLowerCase() == "true";
    static EXIT_ON_UNHANDLED_REJECTION = (process.env["EXIT_ON_UNHANDLED_REJECTION"] || "").toLowerCase() == "true";
    static START_LOCATION_ENGINE = (process.env["START_LOCATION_ENGINE"] || "").toLowerCase() == "true";
    static URL = Site.PRODUCTION ? (process.env["PROD_URL"] || "") : `http://localhost:${Site.PORT}`;
    static MAX_ALLOWED_FLOG_LOG_WEIGHT: number = parseInt(process.env["MAX_ALLOWED_FLOG_LOG_WEIGHT"] || "0") || 5;

    static TG_TOKEN: string = process.env["TG_TOKEN"] ?? "";
    static TG_CHAT_ID: number = parseInt(process.env["TG_CHAT_ID"] ?? "0") || 0;
    static TG_POLLING: boolean = (process.env["TG_POLLING"] || "").toLowerCase() == "true";
    static TG_WH_SECRET_TOKEN: string = process.env["TG_WH_SECRET_TOKEN"] ?? "edqfwvrebwtn7f";
    static TG_BOT_URL: string = process.env["TG_BOT_URL"] ?? "";
}