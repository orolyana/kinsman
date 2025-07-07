"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegexPatterns = void 0;
class RegexPatterns {
}
exports.RegexPatterns = RegexPatterns;
RegexPatterns.deviceId = /^(?:[a-f0-9]{16,}|[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;
RegexPatterns.pushToken = /^ExponentPushToken\[[A-Za-z0-9]{20,45}\]$/;
RegexPatterns.lang = /^[a-z]{2}$/;
