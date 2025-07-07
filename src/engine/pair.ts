import { Log } from "../lib/log";

export class PairEngine {

    private static slug = "Pair Engine";

    static start = () => new Promise<boolean>((resolve, reject) => {
        Log.flow([PairEngine.slug, 'Initialized.'], 0);
        resolve(true);
    });

    static stop = () => new Promise<boolean>((resolve, reject) => {
        resolve(true);
    })
}