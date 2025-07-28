import { summarizeBody } from './../lib/summarize_body';
import axios from "axios";
import { currencies } from "../data/currencies";
import { Log } from "../lib/log";
import { getDateTime, getDateTime2 } from "../lib/date_time";
import { fetchArticleBody } from "../lib/fetch_article_body";
function toEpochMs(input: string): number {
    const iso = input.replace(
        /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
        "$1-$2-$3T$4:$5:$6Z"
    );
    return new Date(iso).getTime();
}

const FINANCIAL_KEYWORDS = [
    "exchange rate", "currency", "inflation", "interest", "central bank",
    "rate decision", "monetary policy", "GDP", "economic", "price", "forecast",
    "bond", "fiscal", "FX", "forex", "reserve", "market", "policy", "devaluation", "rebound", "rise", "fall"
];
const IRRELEVANT_KEYWORDS = ["travel", "tourism", "weather", "fashion", "culture", "recipe", "sports", "celebrity"];


export class GDELTEngine {
    static fetch = (cur: string): Promise<{ title: string; ts: number; date: string; summary: string }[]> => new Promise(async (resolve) => {
        if (!currencies[cur]) return resolve([]);

        const c = currencies[cur];
        const query = `("${c.fullCurrencyName}" OR ${cur} currency)`;

        const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}+sourcelang:english&mode=artlist&format=json&maxrecords=50&timespan=1d`;

        try {
            const res = await axios.get(url, { timeout: 60000 });
            const seen = new Set<string>();

            const articles = (res.data.articles || [])
                .map((art: any) => ({
                    title: art.title.trim(),
                    ts: toEpochMs(art.seendate),
                    date: getDateTime2(toEpochMs(art.seendate)),
                    url: art.url,
                })).
                filter((x: any) => {
                    const t = x.title.toLowerCase();

                    const url = x.url;

                    const matchesCurrency = (
                        t.includes(cur.toLowerCase()) ||
                        t.includes(c.fullCurrencyName.toLowerCase().split(" ")[0])
                    );

                    const hasFinanceContext = FINANCIAL_KEYWORDS.some(kw => t.includes(kw));
                    const hasIrrelevantContext = IRRELEVANT_KEYWORDS.some(kw => t.includes(kw));
                    const isLongEnough = x.title.length >= 25;

                    if (!matchesCurrency || !hasFinanceContext || hasIrrelevantContext || !isLongEnough || seen.has(t)) {
                        return false;
                    }

                    seen.add(t);
                    return true;
                })
                .sort((a: any, b: any) => b.ts - a.ts);

            const newArt = (await Promise.all(articles.map(async (art: any) => {
                const body = await fetchArticleBody(art.url);
                if (body) {
                    const s = await summarizeBody(body, 4);
                    if (s && (!(s || "").toLowerCase().includes("error"))) {
                        let summary: string = `${art.title}.`;
                        summary += ' ' + s;
                        art.summary = summary.trim();
                    }
                }
                delete art.url;
                return art;
            }))).filter(x => !!x.summary);
            resolve(newArt);
        } catch (error) {
            Log.dev(error);
            resolve([]);
        }
    });


}