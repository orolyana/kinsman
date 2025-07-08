"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FFF = exports.convertSubscriptTags = exports.formatForDEX = exports.formatNumber = void 0;
const formatNumber = (input) => {
    // Convert input to a number if it's a string
    const num = typeof input === "string" ? parseFloat(input) : input;
    if (isNaN(num)) {
        return (num || "").toString();
    }
    // Separate the integer and decimal parts
    const [integerPart, decimalPart] = num.toString().split(".");
    // Format the integer part with commas
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    // Combine back with the decimal part, if present
    return decimalPart !== undefined
        ? `${formattedInteger}.${decimalPart}`
        : formattedInteger;
};
exports.formatNumber = formatNumber;
const formatForDEX = (num, sigFigs = 3) => {
    if (num === 0)
        return "0";
    const absNum = Math.abs(num);
    const suffixes = ["", "K", "M", "B", "T", "Q"];
    let magnitude = Math.floor(Math.log10(absNum) / 3);
    if (magnitude > 0) {
        magnitude = Math.min(magnitude, suffixes.length - 1);
        const shortNum = (num / Math.pow(10, magnitude * 3)).toPrecision(sigFigs);
        return `${parseFloat(shortNum)}${suffixes[magnitude]}`;
    }
    if (absNum < 0.001) {
        let exponent = Math.floor(Math.log10(absNum));
        let mantissa = (num / Math.pow(10, exponent)).toPrecision(sigFigs).replace(".", "");
        let subscript = `<sub>${Math.abs(exponent)}</sub>`;
        return `0.0${subscript}${mantissa}`.includes("-") ? ("-" + (`0.0${subscript}${mantissa}`.replace("-", ""))) : `0.0${subscript}${mantissa}`;
    }
    return `${parseFloat(num.toPrecision(sigFigs))}`;
};
exports.formatForDEX = formatForDEX;
const convertSubscriptTags = (input) => {
    const subscriptMap = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
    };
    return input.replace(/<sub>(\d+)<\/sub>/g, (match, p1) => {
        return p1.split('').map((digit) => subscriptMap[digit] || digit).join('');
    });
};
exports.convertSubscriptTags = convertSubscriptTags;
const FFF = (val, appr = 3) => {
    return (0, exports.convertSubscriptTags)((0, exports.formatForDEX)(val, appr));
};
exports.FFF = FFF;
