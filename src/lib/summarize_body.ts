import { Site } from "../site";

const { SummarizerManager } = require('node-summarizer');

export const summarizeBody = async (content: string, lines: number = 5) => {
    let summ: string | null = null;
    try {
        const summarizer = new SummarizerManager(content, lines);
        const { summary } = await summarizer.getSummaryByRank();
        summ = summary ? (`${summary}`).trim() : null;
    } catch (error) {

    }
    finally {
        return summ;
    }
}