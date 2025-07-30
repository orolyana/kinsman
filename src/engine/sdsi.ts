import { Signal } from './../model/signal';
import { Relationship, Snapshot } from './../model/sdsi_models';
import { Site } from '../site';

const MAX_HIST_LENGTH: number = Site.IN_CFG.DIR_LEN || 5;

/**
 * Signal-Derived Strength Indicator
 */
export class SDSI {
    private static relationship: Relationship = {};

    static newPairMonitor = (symbol: string) => {
        const currencies = [symbol.slice(0, 3), symbol.slice(3, 6)];
        for (const curr of currencies) {
            if (!SDSI.relationship[curr]) {
                const otherCurrencies = Object.keys(SDSI.relationship).filter(c => c !== curr)
                SDSI.relationship[curr] = { history: [], relations: Object.fromEntries(otherCurrencies.map(c => [c, null])) }
                for (const c of otherCurrencies) {
                    SDSI.relationship[c].relations[curr] = null;
                }
            }
        }
    }

    static newSignalMonitor = (symbol: string, signal: Signal) => {
        let base = symbol.slice(0, 3);
        let quote = symbol.slice(3, 6);
        if (SDSI.relationship[base] && SDSI.relationship[quote]) {
            SDSI.relationship[base].relations[quote] = signal.long;
            SDSI.relationship[quote].relations[base] = !signal.long;
            const currencies = [base, quote];
            for (const curr of currencies) {
                const relKeys = Object.keys(SDSI.relationship[curr].relations);
                const possible = relKeys.length;
                const boolArr = relKeys.map(c => SDSI.relationship[curr].relations[c]).filter(v => v === true || v === false)
                const wins = boolArr.filter(v => v === true).length;
                const losses = boolArr.filter(v => v === false).length;
                const strength = (wins - losses) / possible;
                SDSI.relationship[curr].history.push(strength);
                if (SDSI.relationship[curr].history.length > MAX_HIST_LENGTH) {
                    SDSI.relationship[curr].history = SDSI.relationship[curr].history.slice(SDSI.relationship[curr].history.length - MAX_HIST_LENGTH);
                }
            }
        }
    }

    private static getSnapshot = (currency: string): Snapshot | null => {
        const data = SDSI.relationship[currency];
        if (!data) return null;

        const history = data.history;
        const len = history.length;

        const strength = len > 0 ? history[len - 1] : 0;
        const trend = len >= 2 ? history[len - 1] - history[0] : 0;
        const momentum = len >= 2
            ? history.slice(1).reduce((acc, val, i) => acc + (val - history[i]), 0) / (len - 1)
            : 0;
        const mean = history.reduce((sum, x) => sum + x, 0) / (len || 1);
        const volatility = len >= 2
            ? Math.sqrt(history.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (len - 1))
            : 0;

        return {
            strength: Number(strength.toFixed(4)),
            trend: Number(trend.toFixed(4)),
            momentum: Number(momentum.toFixed(4)),
            volatility: Number(volatility.toFixed(4)),
            history: [...history]
        };
    };

    static getPairAnalysis = (symbol: string): string | null => {
        const base = symbol.slice(0, 3);
        const quote = symbol.slice(3, 6);
    
        const b = SDSI.getSnapshot(base);
        const q = SDSI.getSnapshot(quote);
        if (!b || !q) return null;
    
        const fmt = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2);
    
        const relStr = b.strength - q.strength;
        const relTrd = b.trend - q.trend;
        const relMom = b.momentum - q.momentum;
    
        const desc = (s: Snapshot, tag: string) =>
            `• ${tag}  Str:${fmt(s.strength)}  Trd:${fmt(s.trend)}  Mom:${fmt(s.momentum)}  Vol:${fmt(s.volatility)}`;
    
        let reco = '';
        if (Math.abs(relStr) < 0.1) {
            reco = `⚖️ No clear edge on ${symbol}`;
        } else if (relStr > 0.3 && relTrd > 0 && relMom > 0) {
            reco = `📈 Strong LONG ${base}`;
        } else if (relStr > 0.1) {
            reco = `↗️ Mild LONG ${base}`;
        } else if (relStr < -0.3 && relTrd < 0 && relMom < 0) {
            reco = `📉 Strong SHORT ${base}`;
        } else {
            reco = `↘️ Mild SHORT ${base}`;
        }
    
        return [
            desc(b, base),
            desc(q, quote),
            `📊 Δ Str:${fmt(relStr)}  Mom:${fmt(relMom)}`,
            `🧭 ${reco}`
        ].join('\n');
    };
    
}