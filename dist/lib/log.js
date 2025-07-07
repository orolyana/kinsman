"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
const site_1 = require("../site");
const date_time_1 = require("./date_time");
class Log {
}
exports.Log = Log;
Log.dev = (...message) => {
    if (!site_1.Site.PRODUCTION) {
        console.log((0, date_time_1.getDateTime)(), ...message);
    }
};
Log.flow = (message, weight = 2) => {
    if ((weight >= 0 && weight <= site_1.Site.MAX_ALLOWED_FLOG_LOG_WEIGHT) || weight == -2 || site_1.Site.MAX_ALLOWED_FLOG_LOG_WEIGHT == -2) {
        console.log(`${(0, date_time_1.getDateTime)()}: ${message.join(" => ")}`);
    }
};
