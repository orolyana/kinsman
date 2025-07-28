declare module 'node-summarizer' {
    class SummarizerManager {
        constructor(content: string, numberOfSentences: number);
        getSummaryByRank(): Promise<{ summary: string }>;
    }

    export = SummarizerManager;
}
