import { getDateTime } from "../lib/date_time";
import { Site } from "../site";
import { PairEngine } from "./pair";
import { TelegramEngine } from "./telegram";

export const startEngine = () => new Promise<boolean>(async (resolve, reject) => {
    const loaded = (await TelegramEngine.start()) && (await PairEngine.start());
    resolve(loaded);
});

export const stopEngine = () => new Promise<boolean>(async (resolve, reject) => {
    const conclude = async () => {
        const ended = (await PairEngine.stop());
        resolve(ended);
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