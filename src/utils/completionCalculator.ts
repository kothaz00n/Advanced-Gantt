import { BarDatum } from "../visual";

export function getCompletionByGroup(rowKey: string, allBars: BarDatum[]): number {
    const groupId = rowKey.replace(/^G:/, "");

    const children = allBars.filter(b => {
        if (b.isGroup) return false;
        const parts = b.rowKey.split("|");
        return parts.length === 2 && parts[1] === groupId;
    });

    const completions = children
        .map(c => Number(c.completion))
        .filter(c => !isNaN(c));

    if (!completions.length) {
        return 0;
    }

    const avg = completions.reduce((a, b) => a + b, 0) / completions.length;
    const boundedAvg = Math.max(0, Math.min(1, avg > 1 ? avg / 100 : avg));
    return boundedAvg;
}