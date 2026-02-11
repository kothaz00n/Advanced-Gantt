import * as d3 from "d3";
import { BarDatum } from "../types";

export function getGroupBarPath(
    scaleX: d3.ScaleTime<number, number>,
    scaleY: d3.ScaleBand<string>,
    d: BarDatum,
    taskHeight: number,
    barHeight: number
): string {
    const x1 = scaleX(d.start);
    const x2 = scaleX(d.end);
    const width = x2 - x1;

    const yTop = scaleY(d.rowKey)! + (taskHeight - barHeight) / 2;
    const topHeight = barHeight * 0.5;
    const tipHeight = barHeight * 0.6;
    const tipInset = Math.min(width * 0.15, 35);

    return `
    M${x1},${yTop}
    H${x2}
    L${x2},${yTop + topHeight + tipHeight}
    L${x2 - tipInset},${yTop + topHeight}
    H${x1 + tipInset}
    L${x1},${yTop + topHeight + tipHeight}
    Z
  `;
}