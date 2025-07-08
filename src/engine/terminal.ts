import { getDateTime } from "../lib/date_time";
import { Site } from "../site";
import { AnalysisEngine } from "./analysis";
import { GroqEngine } from "./groq";
import { PairEngine } from "./pair";
import { TelegramEngine } from "./telegram";

export const startEngine = () => new Promise<boolean>(async (resolve, reject) => {
    const loaded = (await TelegramEngine.start()) && (await PairEngine.start());
    resolve(loaded);
});

export const stopEngine = () => new Promise<boolean>(async (resolve, reject) => {
    const conclude = async () => {
        const ended = await Promise.all([
            PairEngine.stop(),
            AnalysisEngine.stop(),
            GroqEngine.shutdown(),
        ]);
        resolve(ended.every(v => v === true));
    }
    if (Site.PRODUCTION) {
        TelegramEngine.sendMessage(`😴 ${Site.TITLE} is going back to sleep at ${getDateTime()}`, async mid => {
            conclude();
        });
    }
    else {
        conclude();
    }
});