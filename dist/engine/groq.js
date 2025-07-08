"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqEngine = void 0;
const res_1 = require("../lib/res");
const site_1 = require("../site");
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const log_1 = require("../lib/log");
const uuid_1 = require("../lib/uuid");
const models = {
    "allam-2-7b": { RPM: 30, RPD: 7000, TPM: 6000 },
    "compound-beta": { RPM: 15, RPD: 200, TPM: 70000 },
    "compound-beta-mini": { RPM: 15, RPD: 200, TPM: 70000 },
    "deepseek-r1-distill-llama-70b": { RPM: 30, RPD: 1000, TPM: 6000 },
    "gemma2-9b-it": { RPM: 30, RPD: 14400, TPM: 15000, TPD: 500000 },
    "llama-3.1-8b-instant": { RPM: 30, RPD: 14400, TPM: 6000, TPD: 500000 },
    "llama-3.3-70b-versatile": { RPM: 30, RPD: 1000, TPM: 12000, TPD: 100000 },
    "llama3-70b-8192": { RPM: 30, RPD: 14400, TPM: 6000, TPD: 500000 },
    "llama3-8b-8192": { RPM: 30, RPD: 14400, TPM: 6000, TPD: 500000 },
    "meta-llama/llama-4-maverick-17b-128e-instruct": { RPM: 30, RPD: 1000, TPM: 6000 },
    "meta-llama/llama-4-scout-17b-16e-instruct": { RPM: 30, RPD: 1000, TPM: 30000 },
    "meta-llama/llama-guard-4-12b": { RPM: 30, RPD: 14400, TPM: 15000 },
    "meta-llama/llama-prompt-guard-2-22m": { RPM: 30, RPD: 14400, TPM: 15000 },
    "meta-llama/llama-prompt-guard-2-86m": { RPM: 30, RPD: 14400, TPM: 15000 },
    "mistral-saba-24b": { RPM: 30, RPD: 1000, TPM: 6000, TPD: 500000 },
    "qwen-qwq-32b": { RPM: 30, RPD: 1000, TPM: 6000 },
    "qwen/qwen3-32b": { RPM: 60, RPD: 1000, TPM: 6000 },
};
class ActiveModel {
}
class GroqEngine {
}
exports.GroqEngine = GroqEngine;
_a = GroqEngine;
GroqEngine.activeModels = site_1.Site.GROQ_MODELS.filter(x => Object.keys(models).includes(x)).map(name => ({
    name,
    currMin: Date.now(),
    currDay: Date.now(),
    useDay: 0,
    useMin: 0,
    useDayTok: 0,
    useMinTok: 0,
}));
GroqEngine.queue = [];
GroqEngine.isRunning = false;
GroqEngine.client = new groq_sdk_1.default({
    apiKey: site_1.Site.GROQ_KEY,
    maxRetries: site_1.Site.GROQ_MAX_RETRIES,
    timeout: site_1.Site.GROQ_HTTP_TIMEOUT_MS,
});
GroqEngine.request = (req) => {
    var _b;
    const id = uuid_1.UUIDHelper.generate();
    const instReq = {
        messages: req.messages,
        callback: req.callback,
        timeout: site_1.Site.GROQ_REQUEST_TIMEOUT_MS < Infinity
            ? setTimeout(() => {
                const i = _a.queue.findIndex(x => x.id === id);
                if (i >= 0) {
                    if (!_a.queue[i].completed) {
                        _a.queue[i].callback(res_1.GRes.err("API.AI_TIMEOUT", { tr: true }));
                    }
                    _a.queue[i].callback = (r) => { };
                    _a.queue[i].completed = true;
                    _a.queue.splice(i, 1);
                }
            }, site_1.Site.GROQ_REQUEST_TIMEOUT_MS)
            : null,
        preferredModels: req.preferredModels || [],
        id,
        priority: (_b = req.priority) !== null && _b !== void 0 ? _b : Number.MAX_SAFE_INTEGER,
    };
    let index = _a.queue.findIndex(x => x.priority > instReq.priority);
    if (index < 0) {
        _a.queue.push(instReq);
    }
    else {
        _a.queue.splice(index, 0, instReq);
    }
    _a.run();
};
GroqEngine.run = () => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    if (_a.isRunning)
        return;
    _a.isRunning = true;
    let backoff = 200;
    let noModelAvailable = false;
    while (_a.queue.length > 0) {
        let processedOne = false;
        for (let i = 0; i < _a.queue.length; i++) {
            const req = _a.queue[i];
            const now = Date.now();
            const candidates = (req.preferredModels.length > 0
                ? _a.activeModels.filter(m => req.preferredModels.includes(m.name))
                : _a.activeModels).filter(m => {
                const def = models[m.name];
                if (now - m.currMin >= 60000) {
                    m.currMin = now;
                    m.useMin = 0;
                    m.useMinTok = 0;
                }
                if (now - m.currDay >= 86400000) {
                    m.currDay = now;
                    m.useDay = 0;
                    m.useDayTok = 0;
                }
                return m.useMin < def.RPM && m.useDay < def.RPD && m.useMinTok < (def.TPM || Infinity) && m.useDayTok < (def.TPD || Infinity);
            });
            if (candidates.length === 0) {
                if (!noModelAvailable) {
                    log_1.Log.dev("No models currently available due to rate/token limits");
                    noModelAvailable = true;
                }
                continue;
            }
            const selected = candidates.sort((a, b) => a.useMin + a.useDay - (b.useMin + b.useDay))[0];
            log_1.Log.dev(`Selected model is ${selected.name}`);
            const response = yield _a.send(selected.name, req.messages);
            if (!req.completed) {
                if (response.succ) {
                    req.callback(res_1.GRes.succ(response.message));
                }
                else {
                    req.callback(response);
                }
            }
            req.completed = true;
            if (req.timeout) {
                clearTimeout(req.timeout);
                req.timeout = null;
            }
            if ((_b = response.extra) === null || _b === void 0 ? void 0 : _b.tt) {
                selected.useMinTok += response.extra.tt;
                selected.useDayTok += response.extra.tt;
            }
            selected.useMin++;
            selected.useDay++;
            _a.queue.splice(i, 1);
            i--;
            processedOne = true;
            log_1.Log.dev(`Usage for ${selected.name}: ${selected.useMin}/${models[selected.name].RPM} RPM, ${selected.useMinTok}/${(_c = models[selected.name].TPM) !== null && _c !== void 0 ? _c : "∞"} TPM`);
        }
        if (!processedOne)
            backoff = Math.min(backoff * 2, 2000);
        if (!processedOne)
            yield _a.sleep(backoff);
    }
    noModelAvailable = false;
    _a.isRunning = false;
});
GroqEngine.flush = () => __awaiter(void 0, void 0, void 0, function* () {
    while (_a.queue.length > 0 || _a.isRunning) {
        yield _a.sleep(100);
    }
});
GroqEngine.shutdown = () => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        yield _a.flush();
        resolve(true);
    }));
};
GroqEngine.send = (model, messages) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        try {
            const chatCompletion = yield _a.client.chat.completions.create({
                messages: messages,
                model: model,
            });
            const totalTokens = ((_b = chatCompletion.usage) === null || _b === void 0 ? void 0 : _b.total_tokens) || 0;
            const r = chatCompletion.choices.map(x => x.message.content).join("\n").replace(/[\n]{3, }/g, "\n\n");
            resolve(res_1.GRes.succ(r, { tt: totalTokens }));
        }
        catch (err) {
            log_1.Log.dev(err, err.message);
            if (err instanceof groq_sdk_1.default.APIError) {
                resolve(res_1.GRes.err("API.GROQ_ERROR", { tr: true, reason: err.message || err.name || err.status }));
            }
            else {
                resolve(res_1.GRes.err("API.GROQ_ERROR", { tr: true, reason: err.message || err }));
            }
        }
    }));
};
GroqEngine.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
