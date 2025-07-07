"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = void 0;
const sleep = (ms) => new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve();
    }, ms);
});
exports.sleep = sleep;
