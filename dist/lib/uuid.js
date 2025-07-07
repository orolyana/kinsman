"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UUIDHelper = void 0;
const uuid_1 = require("uuid");
class UUIDHelper {
}
exports.UUIDHelper = UUIDHelper;
UUIDHelper.generate = () => (0, uuid_1.v4)();
UUIDHelper.short = () => UUIDHelper.generate().split("-")[0];
UUIDHelper.validate = (ud) => (0, uuid_1.validate)(ud);
