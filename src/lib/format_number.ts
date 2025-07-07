export const formatNumber = (input: number | string): string => {
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
}