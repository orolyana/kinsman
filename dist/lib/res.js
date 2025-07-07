"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GRes = exports.Res = void 0;
class Res {
}
exports.Res = Res;
class GRes {
}
exports.GRes = GRes;
GRes.succ = (message = "", extra = {}) => {
    let r = { succ: true, message, extra };
    if (extra) {
        r.extra = extra;
    }
    return r;
};
GRes.err = (message = "", extra = {}) => {
    let r = { succ: false, message, extra };
    if (extra) {
        r.extra = extra;
    }
    return r;
};
